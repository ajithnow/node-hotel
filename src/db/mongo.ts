import mongoose from "mongoose";

export async function initMongo(mongoUri?: string) {
  const uri = mongoUri || process.env.MONGODB_URI;
  const uriToUse = uri;
  if (!uriToUse) {
    console.log("MONGODB_URI not provided — MongoDB logging disabled");
    return;
  }

  try {
    await mongoose.connect(uriToUse);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.warn("Failed to connect to MongoDB (logging disabled):", err);
    // Do not throw — make Mongo optional and non-fatal for app startup
    return;
  }
}

export function isMongoConnected() {
  // 1 = connected
  return mongoose.connection?.readyState === 1;
}

// Simple request log schema for hotelier audit/logging
const RequestLogSchema = new mongoose.Schema(
  {
    method: String,
    path: String,
    status: Number,
    durationMs: Number,
    ip: String,
    body: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: () => new Date() },
  },
  { collection: "request_logs" }
);

export const RequestLog =
  mongoose.models.RequestLog || mongoose.model("RequestLog", RequestLogSchema);
