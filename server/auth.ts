import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, type InsertUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

// Extend Express.User
declare global {
  namespace Express {
    interface User extends InsertUser {}
  }
}

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64,
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Dynamically set cookie security based on the request
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "petra-panel-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: 'auto', // Automatically set secure based on request protocol
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      path: '/',
      sameSite: isProduction ? 'none' : 'lax' // Important for cross-site cookies in production
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // 24 horas
    }),
    proxy: true // Keep proxy support for header handling
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Authenticating user:", username);
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }

        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user);
      } catch (err) {
        console.error("Authentication error:", err);
        return done(err);
      }
    }),
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
        console.log("User not found during deserialization, id:", id);
        return done(null, false);
      }

      done(null, user);
    } catch (err) {
      console.error("Deserialization error:", err);
      done(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log("Login successful for user:", req.user?.username);
    res.json(req.user);
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Registering user:", username);

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already taken");
      }

      const hashedPassword = await crypto.hash(password);
      const [user] = await db
        .insert(users)
        .values({ username, password: hashedPassword })
        .returning();

      req.login(user, (err) => {
        if (err) {
          return res.status(500).send(err.message);
        }
        res.json(user);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/logout", (req, res) => {
    const username = req.user?.username;
    req.logout((err) => {
      if (err) {
        console.error("Logout error for user:", username, err);
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      console.log("User logged out successfully:", username);
      res.json({ message: "Sesión cerrada correctamente" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("No autenticado");
  });
}