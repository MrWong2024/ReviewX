import { createHmac, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CheckSmsCodeResult,
  NormalizedSmsPhone,
  SendSmsCodeResult,
  SmsAuthProvider,
} from '../types/sms-auth.types';

type AliyunSmsRuntimeConfig = {
  provider: SmsAuthProvider;
  accessKeyId: string;
  accessKeySecret: string;
  regionId: string;
  endpoint: string;
  countryCode: '86';
  signName: string;
  templateCode: string;
  templateParam: string;
  codeLength: number;
  validTimeSeconds: number;
  duplicatePolicy: 1 | 2;
  intervalSeconds: number;
  codeType: number;
  caseAuthPolicy: 1 | 2;
};

type AliyunSmsRpcResponse = {
  Success?: boolean;
  Code?: string;
  Model?: {
    VerifyResult?: string;
  };
};

type RpcParamValue = string | number;
type RpcParams = Record<string, RpcParamValue>;

const DEFAULT_PROVIDER: SmsAuthProvider = 'stub';
const DEFAULT_REGION_ID = 'cn-shenzhen';
const DEFAULT_ENDPOINT = 'dypnsapi.aliyuncs.com';
const DEFAULT_COUNTRY_CODE = '86';
const DEFAULT_SIGN_NAME = '速通互联验证码';
const DEFAULT_TEMPLATE_CODE = '100001';
const DEFAULT_TEMPLATE_PARAM = '{"code":"##code##","min":"5"}';
const DEFAULT_CODE_LENGTH = 6;
const DEFAULT_VALID_TIME_SECONDS = 300;
const DEFAULT_DUPLICATE_POLICY = 1;
const DEFAULT_INTERVAL_SECONDS = 60;
const DEFAULT_CODE_TYPE = 1;
const DEFAULT_CASE_AUTH_POLICY = 1;
const STUB_VERIFY_CODE = '000000';
const ALIYUN_RPC_VERSION = '2017-05-25';

export class SmsAuthConfigurationError extends Error {}

export class SmsAuthProviderError extends Error {}

@Injectable()
export class AliyunSmsAuthService {
  constructor(private readonly configService: ConfigService) {}

  normalizePhoneForAliyun(phone: string): NormalizedSmsPhone | null {
    const trimmed = phone.trim();
    const normalized = trimmed.startsWith('+86')
      ? trimmed.slice(3)
      : trimmed.startsWith('86')
        ? trimmed.slice(2)
        : trimmed;

    if (!/^1\d{10}$/.test(normalized)) {
      return null;
    }

    return {
      countryCode: '86',
      phoneNumber: normalized,
    };
  }

  getCooldownSeconds(): number {
    return this.getRuntimeConfig().intervalSeconds;
  }

  getExpiresInSeconds(): number {
    return this.getRuntimeConfig().validTimeSeconds;
  }

  async sendSmsVerifyCode(phone: string): Promise<SendSmsCodeResult> {
    const config = this.getRuntimeConfig();

    if (config.provider === 'stub') {
      return { success: true };
    }

    this.assertAliyunConfig(config, 'send');
    const normalizedPhone = this.normalizePhoneForAliyun(phone);

    if (!normalizedPhone) {
      throw new SmsAuthProviderError('invalid_phone');
    }

    const payload = await this.signedRpcRequest(config, 'SendSmsVerifyCode', {
      CountryCode: normalizedPhone.countryCode,
      PhoneNumber: normalizedPhone.phoneNumber,
      SignName: config.signName,
      TemplateCode: config.templateCode,
      TemplateParam: config.templateParam,
      CodeLength: config.codeLength,
      ValidTime: config.validTimeSeconds,
      DuplicatePolicy: config.duplicatePolicy,
      Interval: config.intervalSeconds,
      CodeType: config.codeType,
    });

    if (payload.Success !== true || payload.Code !== 'OK') {
      throw new SmsAuthProviderError('send_failed');
    }

    return { success: true };
  }

  async checkSmsVerifyCode(
    phone: string,
    verifyCode: string,
  ): Promise<CheckSmsCodeResult> {
    const config = this.getRuntimeConfig();

    if (config.provider === 'stub') {
      return { verified: verifyCode.trim() === STUB_VERIFY_CODE };
    }

    this.assertAliyunConfig(config, 'check');
    const normalizedPhone = this.normalizePhoneForAliyun(phone);

    if (!normalizedPhone) {
      return { verified: false };
    }

    const payload = await this.signedRpcRequest(config, 'CheckSmsVerifyCode', {
      CountryCode: normalizedPhone.countryCode,
      PhoneNumber: normalizedPhone.phoneNumber,
      VerifyCode: verifyCode.trim(),
      CaseAuthPolicy: config.caseAuthPolicy,
    });

    if (payload.Success !== true || payload.Code !== 'OK') {
      throw new SmsAuthProviderError('check_failed');
    }

    return {
      verified: payload.Model?.VerifyResult === 'PASS',
    };
  }

  private async signedRpcRequest(
    config: AliyunSmsRuntimeConfig,
    action: 'SendSmsVerifyCode' | 'CheckSmsVerifyCode',
    params: RpcParams,
  ): Promise<AliyunSmsRpcResponse> {
    const unsignedParams: RpcParams = {
      Format: 'JSON',
      Version: ALIYUN_RPC_VERSION,
      AccessKeyId: config.accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      Timestamp: new Date().toISOString(),
      SignatureVersion: '1.0',
      SignatureNonce: randomUUID(),
      RegionId: config.regionId,
      Action: action,
      ...params,
    };
    const canonicalizedQueryString =
      this.buildCanonicalizedQueryString(unsignedParams);
    const stringToSign = `GET&%2F&${percentEncode(
      canonicalizedQueryString,
    )}`;
    const signature = createHmac('sha1', `${config.accessKeySecret}&`)
      .update(stringToSign)
      .digest('base64');
    const queryString = this.buildCanonicalizedQueryString({
      ...unsignedParams,
      Signature: signature,
    });
    const endpoint = `https://${normalizeEndpoint(config.endpoint)}/?${queryString}`;

    let response: Response;

    try {
      response = await fetch(endpoint, { method: 'GET' });
    } catch {
      throw new SmsAuthProviderError('request_failed');
    }

    if (!response.ok) {
      throw new SmsAuthProviderError('http_failed');
    }

    let payload: unknown;

    try {
      payload = (await response.json()) as unknown;
    } catch {
      throw new SmsAuthProviderError('invalid_json');
    }

    if (!isAliyunSmsRpcResponse(payload)) {
      throw new SmsAuthProviderError('invalid_response');
    }

    return payload;
  }

  private buildCanonicalizedQueryString(params: RpcParams): string {
    return Object.keys(params)
      .sort()
      .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
      .join('&');
  }

  private assertAliyunConfig(
    config: AliyunSmsRuntimeConfig,
    action: 'send' | 'check',
  ): void {
    if (!config.accessKeyId || !config.accessKeySecret) {
      throw new SmsAuthConfigurationError('aliyun_sms_access_key_missing');
    }

    if (!config.endpoint || !config.regionId || config.countryCode !== '86') {
      throw new SmsAuthConfigurationError('aliyun_sms_base_config_missing');
    }

    if (action === 'send') {
      if (
        !config.signName ||
        !config.templateCode ||
        !config.templateParam ||
        !config.templateParam.includes('##code##')
      ) {
        throw new SmsAuthConfigurationError('aliyun_sms_template_missing');
      }
    }
  }

  private getRuntimeConfig(): AliyunSmsRuntimeConfig {
    const appEnv = this.getString('app.env', 'development');
    const configuredProvider = this.parseProvider(
      this.getString('smsAuth.provider', DEFAULT_PROVIDER),
    );

    return {
      provider: appEnv === 'test' ? 'stub' : configuredProvider,
      accessKeyId: this.getString('smsAuth.aliyun.accessKeyId', ''),
      accessKeySecret: this.getString('smsAuth.aliyun.accessKeySecret', ''),
      regionId: this.getString('smsAuth.aliyun.regionId', DEFAULT_REGION_ID),
      endpoint: this.getString('smsAuth.aliyun.endpoint', DEFAULT_ENDPOINT),
      countryCode: '86',
      signName: this.getString(
        'smsAuth.aliyun.signName',
        DEFAULT_SIGN_NAME,
      ),
      templateCode: this.getString(
        'smsAuth.aliyun.templateCode',
        DEFAULT_TEMPLATE_CODE,
      ),
      templateParam: this.getString(
        'smsAuth.aliyun.templateParam',
        DEFAULT_TEMPLATE_PARAM,
      ),
      codeLength: this.getNumber(
        'smsAuth.aliyun.codeLength',
        DEFAULT_CODE_LENGTH,
        4,
      ),
      validTimeSeconds: this.getNumber(
        'smsAuth.aliyun.validTimeSeconds',
        DEFAULT_VALID_TIME_SECONDS,
        1,
      ),
      duplicatePolicy: this.parsePolicy(
        this.getNumber(
          'smsAuth.aliyun.duplicatePolicy',
          DEFAULT_DUPLICATE_POLICY,
          1,
        ),
      ),
      intervalSeconds: this.getNumber(
        'smsAuth.aliyun.intervalSeconds',
        DEFAULT_INTERVAL_SECONDS,
        0,
      ),
      codeType: this.getNumber(
        'smsAuth.aliyun.codeType',
        DEFAULT_CODE_TYPE,
        1,
      ),
      caseAuthPolicy: this.parsePolicy(
        this.getNumber(
          'smsAuth.aliyun.caseAuthPolicy',
          DEFAULT_CASE_AUTH_POLICY,
          1,
        ),
      ),
    };
  }

  private getString(configKey: string, fallback: string): string {
    const value = this.configService.get<string>(configKey);

    return typeof value === 'string' && value.trim()
      ? value.trim()
      : fallback;
  }

  private getNumber(
    configKey: string,
    fallback: number,
    minValue: number,
  ): number {
    const value = this.configService.get<number>(configKey);
    const parsed =
      typeof value === 'number' && Number.isFinite(value) ? value : fallback;

    return parsed >= minValue ? Math.trunc(parsed) : fallback;
  }

  private parseProvider(value: string): SmsAuthProvider {
    return value === 'aliyun' ? 'aliyun' : 'stub';
  }

  private parsePolicy(value: number): 1 | 2 {
    return value === 2 ? 2 : 1;
  }
}

function percentEncode(value: RpcParamValue): string {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function isAliyunSmsRpcResponse(value: unknown): value is AliyunSmsRpcResponse {
  if (!isRecord(value)) {
    return false;
  }

  if (value.Success !== undefined && typeof value.Success !== 'boolean') {
    return false;
  }

  if (value.Code !== undefined && typeof value.Code !== 'string') {
    return false;
  }

  if (value.Model !== undefined && !isRecord(value.Model)) {
    return false;
  }

  if (
    isRecord(value.Model) &&
    value.Model.VerifyResult !== undefined &&
    typeof value.Model.VerifyResult !== 'string'
  ) {
    return false;
  }

  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
