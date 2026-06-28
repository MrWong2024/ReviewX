import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ConsensusDraftLlmResult,
  GenerateConsensusDraftWithLlmInput,
} from '../types/consensus-draft-llm.types';

type ChatMessage = {
  content: string;
  role: 'system' | 'user';
};

type BailianRuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  maxRetries: number;
  model: string;
  provider: string;
  timeoutMs: number;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

type ParsedDraftContent = {
  draftOpinion: string;
  draftScore?: number;
};

const DEFAULT_BAILIAN_TIMEOUT_MS = 90000;
const DEFAULT_BAILIAN_MAX_RETRIES = 1;
const MAX_DRAFT_OPINION_LENGTH = 3000;
const MAX_PROMPT_TEXT_FIELD_LENGTH = 500;

@Injectable()
export class ConsensusDraftLlmService {
  constructor(private readonly configService: ConfigService) {}

  async generateDraft(
    input: GenerateConsensusDraftWithLlmInput,
  ): Promise<ConsensusDraftLlmResult> {
    const config = this.getRuntimeConfig();
    const missingReason = this.getMissingConfigReason(config);

    if (missingReason) {
      return { ok: false, reason: missingReason };
    }

    const endpoint = `${trimTrailingSlash(config.baseUrl)}/chat/completions`;
    const requestBody = {
      messages: this.buildMessages(input),
      model: config.model,
      temperature: 0.2,
    };
    const maxAttempts = config.maxRetries + 1;
    let lastFailureReason = 'unknown_error';

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetch(endpoint, {
          body: JSON.stringify(requestBody),
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          signal: controller.signal,
        });

        if (!response.ok) {
          lastFailureReason = `http_${response.status}`;
          continue;
        }

        const payload = (await response.json()) as unknown;
        const content = this.getMessageContent(payload);

        if (!content) {
          lastFailureReason = 'missing_message_content';
          continue;
        }

        const parsed = this.parseDraftContent(content);

        if (!parsed.draftOpinion) {
          lastFailureReason = 'empty_draft_opinion';
          continue;
        }

        return {
          ok: true,
          draftOpinion: parsed.draftOpinion,
          draftScore: parsed.draftScore,
        };
      } catch (error) {
        lastFailureReason = isAbortError(error) ? 'timeout' : 'request_failed';
      } finally {
        clearTimeout(timeout);
      }
    }

    return { ok: false, reason: lastFailureReason };
  }

  private getRuntimeConfig(): BailianRuntimeConfig {
    return {
      provider: this.getRuntimeString('LLM_PROVIDER', 'llm.provider', 'stub')
        .toLowerCase(),
      apiKey: this.getRuntimeString(
        'BAILIAN_API_KEY',
        'llm.bailian.apiKey',
        '',
      ),
      baseUrl: this.getRuntimeString(
        'BAILIAN_BASE_URL',
        'llm.bailian.baseUrl',
        '',
      ),
      model: this.getRuntimeString('BAILIAN_MODEL', 'llm.bailian.model', ''),
      timeoutMs: this.getRuntimeNumber(
        'BAILIAN_TIMEOUT_MS',
        'llm.bailian.timeoutMs',
        DEFAULT_BAILIAN_TIMEOUT_MS,
        1,
      ),
      maxRetries: this.getRuntimeNumber(
        'BAILIAN_MAX_RETRIES',
        'llm.bailian.maxRetries',
        DEFAULT_BAILIAN_MAX_RETRIES,
        0,
      ),
    };
  }

  private getMissingConfigReason(config: BailianRuntimeConfig): string | null {
    if (config.provider !== 'bailian') {
      return 'provider_not_bailian';
    }

    if (!config.apiKey) {
      return 'missing_bailian_api_key';
    }

    if (!config.baseUrl) {
      return 'missing_bailian_base_url';
    }

    if (!config.model) {
      return 'missing_bailian_model';
    }

    return null;
  }

  private buildMessages(input: GenerateConsensusDraftWithLlmInput): ChatMessage[] {
    return [
      {
        role: 'system',
        content:
          '你是科技项目评审合议意见助手。只能基于提供的专家评分、评价描述、问题和改进建议进行归纳。不得编造未提供的事实、成果、数据、单位、论文、专利、经济效益。输出应客观、正式、适合科技局项目评审。需要体现成绩、问题、改进方向。不得输出 Markdown 表格。不得输出 JSON 以外的说明。',
      },
      {
        role: 'user',
        content: [
          '请根据以下项目评审数据生成合议草稿。',
          '必须只输出 JSON，结构为：{"draftOpinion":"string","draftScore":number}',
          'draftScore 如无充分理由建议采用专家平均分。',
          '数据：',
          JSON.stringify(this.buildPromptData(input), null, 2),
        ].join('\n'),
      },
    ];
  }

  private buildPromptData(input: GenerateConsensusDraftWithLlmInput) {
    return {
      project: {
        name: input.project.name,
        projectNo: input.project.projectNo,
      },
      reviewScheme: {
        name: input.reviewSchemeSnapshot.name ?? '',
        totalScore: input.reviewSchemeSnapshot.totalScore,
        items: input.reviewSchemeSnapshot.items.map((item) => ({
          name: item.name,
          maxScore: item.maxScore,
          scoringGuide: truncateText(
            item.scoringGuide ?? '',
            MAX_PROMPT_TEXT_FIELD_LENGTH,
          ),
          sortOrder: item.sortOrder,
        })),
      },
      expertReviewStats: {
        expertCount: input.reviewSummary.assignedExpertCount,
        submittedCount: input.reviewSummary.submittedExpertCount,
        averageScore: input.reviewSummary.averageScore,
        minScore: input.reviewSummary.minScore,
        maxScore: input.reviewSummary.maxScore,
      },
      expertReviews: input.submittedReviews.map((review, index) => ({
        expertName: review.expert?.name ?? `专家${index + 1}`,
        totalScore: review.totalScore,
        submittedAt: review.submittedAt ?? null,
        items: review.items.map((item) => ({
          scoringItem: item.itemSnapshot.name,
          maxScore: item.itemSnapshot.maxScore,
          score: item.score ?? null,
          hasMajorIssue: item.hasMajorIssue,
          evaluationDescription: truncateText(
            item.evaluationDescription,
            MAX_PROMPT_TEXT_FIELD_LENGTH,
          ),
          improvementSuggestion: truncateText(
            item.improvementSuggestion,
            MAX_PROMPT_TEXT_FIELD_LENGTH,
          ),
        })),
      })),
    };
  }

  private getMessageContent(payload: unknown): string | null {
    if (!isChatCompletionResponse(payload)) {
      return null;
    }

    const content = payload.choices?.[0]?.message?.content;

    return typeof content === 'string' ? content.trim() : null;
  }

  private parseDraftContent(content: string): ParsedDraftContent {
    const normalized = stripJsonFence(content);
    const parsedJson = parseJsonObject(normalized);

    if (parsedJson) {
      const draftOpinion =
        typeof parsedJson.draftOpinion === 'string'
          ? truncateOpinion(parsedJson.draftOpinion)
          : '';
      const draftScore = parseScore(parsedJson.draftScore);

      return draftScore === undefined
        ? { draftOpinion }
        : { draftOpinion, draftScore };
    }

    return {
      draftOpinion: truncateOpinion(normalized),
    };
  }

  private getRuntimeString(
    envKey: string,
    configKey: string,
    fallback: string,
  ): string {
    const envValue = process.env[envKey];

    if (envValue !== undefined) {
      return envValue.trim();
    }

    const configValue = this.configService.get<string>(configKey);

    return typeof configValue === 'string' ? configValue.trim() : fallback;
  }

  private getRuntimeNumber(
    envKey: string,
    configKey: string,
    fallback: number,
    minValue: number,
  ): number {
    const envValue = process.env[envKey];
    const rawValue =
      envValue !== undefined
        ? Number(envValue)
        : this.configService.get<number>(configKey);
    const parsed =
      typeof rawValue === 'number' && Number.isFinite(rawValue)
        ? rawValue
        : fallback;

    return parsed >= minValue ? Math.trunc(parsed) : fallback;
  }
}

function isChatCompletionResponse(
  value: unknown,
): value is ChatCompletionResponse {
  if (!isRecord(value)) {
    return false;
  }

  return value.choices === undefined || Array.isArray(value.choices);
}

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  return (fenceMatch?.[1] ?? trimmed).trim();
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  const directParsed = parseRecord(content);

  if (directParsed) {
    return directParsed;
  }

  const startIndex = content.indexOf('{');
  const endIndex = content.lastIndexOf('}');

  if (startIndex < 0 || endIndex <= startIndex) {
    return null;
  }

  return parseRecord(content.slice(startIndex, endIndex + 1));
}

function parseRecord(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseScore(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function truncateOpinion(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length <= MAX_DRAFT_OPINION_LENGTH) {
    return trimmed;
  }

  const truncated = trimmed.slice(0, MAX_DRAFT_OPINION_LENGTH);
  const sentenceEndIndex = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？'),
    truncated.lastIndexOf('.'),
  );

  if (sentenceEndIndex >= MAX_DRAFT_OPINION_LENGTH * 0.6) {
    return truncated.slice(0, sentenceEndIndex + 1).trim();
  }

  return truncated.trim();
}

function truncateText(value: string, maxLength: number): string {
  const trimmed = value.trim();

  return trimmed.length > maxLength
    ? trimmed.slice(0, maxLength).trim()
    : trimmed;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
