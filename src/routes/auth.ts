import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import type {
  UserPublic,
  RegisterBody,
  LoginBody,
} from "../modules/auth/interfaces/user.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import prisma from "../db/prisma.js";

const router = Router();

// Register
router.post(
  "/register",
  async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    const { email, username, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });

    try {
      const hash = await argon2.hash(password);
      // Prisma's generated types (with `exactOptionalPropertyTypes`) treat optional fields
      // differently: a field declared `String?` in schema becomes `string | null` (not
      // `string | undefined`). Passing `undefined` for that property causes a TS error.
      // To avoid that, normalize `username` to `null` when it's undefined so the type
      // matches what Prisma expects.
      const user = await prisma.user.create({
        data: { email, username: username ?? null, password: hash },
      });
      return res.status(201).json({ id: user.id, email: user.email });
    } catch (err: any) {
      if (err?.code === "P2002") {
        return res
          .status(409)
          .json({ error: "User with that email/username already exists" });
      }
      console.error(err);
      return res.status(500).json({ error: "failed to create user" });
    }
  }
);

// Login (uses passport local)
router.post(
  "/login",
  (req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      { session: false },
      (err: Error | null, user: UserPublic | false, info: any) => {
        if (err) return next(err);
        if (!user)
          return res
            .status(401)
            .json({ error: info?.message ?? "Unauthorized" });

        // Sign jwt
        const secret = process.env.JWT_SECRET;
        if (!secret)
          return res.status(500).json({ error: "JWT_SECRET not configured" });
        const token = jwt.sign({ sub: String(user.id) }, secret, {
          expiresIn: "1h",
        });
        return res.json({ access_token: token, token_type: "Bearer" });
      }
    )(req, res, next);
  }
);

// Me
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  (req: Request, res: Response) => {
    const user = req.user as UserPublic | undefined;
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, email: user.email, username: user.username });
  }
);

export default router;
