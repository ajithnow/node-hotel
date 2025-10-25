export const CONFIG = {
  DATABASE_URL:
    process.env.DATABASE_URL ??
    (() => {
      throw new Error("DATABASE_URL is required");
    })(),
  // Make MongoDB optional for now — logging can be disabled if not provided
  MONGODB_URI: process.env.MONGODB_URI ?? null,
  // Explicit flag to enable Mongo initialization. Set to 'true' or '1' to enable.
  MONGO_ENABLED:
    (process.env.MONGO_ENABLED === "true" ||
      process.env.MONGO_ENABLED === "1") ??
    false,
  // JWT secret for signing bearer tokens (required)
  JWT_SECRET:
    process.env.JWT_SECRET ??
    (() => {
      throw new Error("JWT_SECRET is required");
    })(),
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;

export type Config = typeof CONFIG;
