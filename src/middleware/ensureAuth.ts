import passport from "passport";
import type { RequestHandler } from "express";
import type { UserPublic } from "../modules/auth/interfaces/user.js";

export const ensureAuth: RequestHandler = (req, res, next) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: any, user: UserPublic | false) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      req.user = user;
      next();
    }
  )(req, res, next);
};
