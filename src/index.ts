import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";

import { initPostgres } from "./db/postgres.js";
import { initMongo } from "./db/mongo.js";
import bookingsRouter from "./routes/bookings.js";
import { requestLogger } from "./middleware/requestLogger.js";

// Load .env first, then override with .env.local if it exists (common local dev pattern)
dotenv.config();
const localEnvPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(localEnvPath)) {
  try {
    const parsed = dotenv.parse(fs.readFileSync(localEnvPath));
    // override or set values from .env.local
    for (const k of Object.keys(parsed)) {
      process.env[k] = parsed[k];
    }
    console.log("Loaded .env.local");
  } catch (err) {
    console.warn("Failed to load .env.local:", err);
  }
}

const app = express();
let port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/health", (req, res) => res.json({ ok: true }));

// Basic root route to verify the server is running in a browser
app.get("/", (req, res) => {
  res.json({ ok: true, service: "Hotel Manager API", docs: "/health" });
});

app.use("/bookings", bookingsRouter);

async function start() {
  try {
    // import CONFIG after dotenv has loaded so process.env is populated
    const { CONFIG } = await import("./config.js");

    if (CONFIG.MONGO_ENABLED) {
      if (CONFIG.MONGODB_URI) {
        await initMongo(CONFIG.MONGODB_URI);
      } else {
        console.warn(
          "MONGO_ENABLED is true but MONGODB_URI is not set — skipping Mongo initialization"
        );
      }
    } else {
      console.log("MongoDB disabled (MONGO_ENABLED not set)");
    }

    await initPostgres(CONFIG.DATABASE_URL);

    // Initialize passport and mount auth routes after dynamic imports
    {
      const { setupPassport } = await import("./auth/passport.js");
      const passport = (await import("passport")).default;
      const authRouter = (await import("./routes/auth.js")).default;

      setupPassport(CONFIG.JWT_SECRET);
      app.use(passport.initialize());
      app.use("/auth", authRouter);
    }

    port = CONFIG.PORT;

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
