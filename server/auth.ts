import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { users, type User as DBUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { 
  securityUtils, 
  checkAccountLockout, 
  recordFailedLoginAttempt, 
  resetFailedLoginAttempts,
  SECURITY_CONSTANTS
} from "./services/security";

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
}

declare global {
  namespace Express {
    interface User extends DBUser {}
  }
}

export const passwordUtils = securityUtils;

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || process.env.REPL_ID || "petra-panel-secret",
    resave: true,
    saveUninitialized: true,
    store: new MemoryStore({
      checkPeriod: 86400000
    }),
    name: 'petrapanel.sid',
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      path: '/',
      sameSite: 'lax'
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Simplificar el middleware CSRF para desarrollo
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      return next();
    }

    if (!req.session.csrfToken) {
      req.session.csrfToken = securityUtils.generateCSRFToken();
    }

    res.setHeader('X-CSRF-Token', req.session.csrfToken);
    req.csrfToken = () => req.session.csrfToken || "";

    // En desarrollo, permitir todas las peticiones
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // En producción, verificar solo para métodos no seguros
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const requestToken = req.headers['x-csrf-token'] || req.body?.csrfToken;
    if (!requestToken || requestToken !== req.session.csrfToken) {
      return res.status(403).json({
        success: false,
        message: "Error de validación de seguridad"
      });
    }

    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Authenticating user:", username);

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username.toLowerCase()))
          .limit(1);

        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Credenciales incorrectas" });
        }

        const isMatch = await passwordUtils.comparePassword(password, user.password);

        if (!isMatch) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false, { message: "Credenciales incorrectas" });
        }

        console.log(`Authentication successful for user: ${username}`);
        return done(null, user);
      } catch (err) {
        console.error("Authentication error:", err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user:", id);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        console.log("User not found during deserialization:", id);
        return done(null, false);
      }

      done(null, user);
    } catch (err) {
      console.error("Deserialization error:", err);
      done(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req: Request, res: Response) => {
    console.log("Login successful for user:", req.user?.username);
    const userToReturn = { ...req.user };
    delete userToReturn.password;
    res.json(userToReturn);
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.json({ message: "Sesión cerrada correctamente" });
    });
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      const userToReturn = { ...req.user };
      delete userToReturn.password;
      return res.json(userToReturn);
    }
    res.status(401).json({ message: "No autenticado" });
  });
}