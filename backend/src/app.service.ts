import { Injectable } from '@nestjs/common';

export type AppHealthResponse = {
  status: 'ok';
  service: 'reviewx-backend';
};

@Injectable()
export class AppService {
  getHealth(): AppHealthResponse {
    return {
      status: 'ok',
      service: 'reviewx-backend',
    };
  }
}
