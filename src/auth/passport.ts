import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import argon2 from "argon2";
import prisma from "../db/prisma.js";

export function setupPassport(jwtSecret: string) {
  // Local strategy: username or email + password
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: false,
      },
      async (username, password, done) => {
        try {
          const user = await prisma.user.findFirst({
            where: { OR: [{ username }, { email: username }] },
          });
          if (!user)
            return done(null, false, { message: "Invalid credentials" });

          const valid = await argon2.verify(user.password, password);
          if (!valid)
            return done(null, false, { message: "Invalid credentials" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // JWT strategy for protected routes
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: jwtSecret,
        passReqToCallback: false,
      },
      async (payload, done) => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: Number(payload.sub) },
          });
          if (!user) return done(null, false);
          return done(null, user);
        } catch (err) {
          return done(err as any, false);
        }
      }
    )
  );

  return passport;
}
