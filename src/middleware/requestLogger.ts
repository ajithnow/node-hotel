import type { RequestHandler } from "express";
import { RequestLog, isMongoConnected } from "../db/mongo.js";

export const requestLogger: RequestHandler = async (req, res, next) => {
  const start = Date.now();

  res.on("finish", async () => {
    const durationMs = Date.now() - start;
    try {
      // Skip logging if Mongo isn't connected / configured
      if (!isMongoConnected()) return;

      // Use `new Model(...).save()` to avoid TypeScript overload union errors with `Model.create`.
      const doc = new RequestLog({
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs,
        ip: req.ip,
        body: req.body,
        query: req.query,
      });

      await doc.save();
    } catch (err) {
      // Logging failure should not break the request
      console.error("Failed to write request log:", err);
    }
  });

  next();
};
