const DEFAULT_PORT = 5000;
const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseNumber(process.env.PORT, DEFAULT_PORT),
    frontendUrl: process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL,
    corsOrigin:
      process.env.CORS_ORIGIN ??
      process.env.FRONTEND_URL ??
      DEFAULT_FRONTEND_URL,
  },
  mongo: {
    uri: process.env.MONGO_URI ?? '',
  },
});
