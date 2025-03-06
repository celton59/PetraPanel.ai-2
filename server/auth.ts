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
  
  // Para Cloudflare Flexible, necesitamos un middleware que configure las cookies dinámicamente
  app.use((req, res, next) => {
    const host = req.get('host') || '';
    const isCloudflareFlexible = host === 'petrapanel.ai';
    
    // La cookie la establecemos a través de un middleware en vez de en la configuración
    if (isCloudflareFlexible) {
      console.log('Configuración para petrapanel.ai (Cloudflare Flexible) aplicada');
    }
    
    next();
  });
  
  // La configuración base debe ser lo más simple posible para evitar problemas
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "petra-panel-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // SIEMPRE poner secure: false para Cloudflare Flexible SSL
      secure: false,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      path: '/',
      sameSite: 'lax' // 'none' puede causar problemas, usamos 'lax'
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // 24 horas
    }),
    proxy: true // Mantener proxy para manejar las cabeceras correctamente
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Authenticating user:", username);
        
        // Buscar usuarios ignorando mayúsculas/minúsculas
        const usersResult = await db
          .select()
          .from(users);
          
        // Filtrar manualmente para encontrar la coincidencia insensible a mayúsculas/minúsculas
        const user = usersResult.find(u => 
          u.username.toLowerCase() === username.toLowerCase() ||
          u.username.charAt(0).toUpperCase() + u.username.slice(1) === username ||
          u.username.charAt(0).toLowerCase() + u.username.slice(1) === username
        );

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
    const userToReturn = JSON.parse(JSON.stringify(req.user))
    delete userToReturn.password;
    res.json(userToReturn);
  });

  // app.post("/api/register", async (req, res) => {
  //   try {
  //     const { username, password } = req.body;
  //     console.log("Registering user:", username);

  //     // Verificar si el usuario ya existe
  //     const [existingUser] = await db
  //       .select()
  //       .from(users)
  //       .where(eq(users.username, username))
  //       .limit(1);

  //     if (existingUser) {
  //       return res.status(400).send("Username already taken");
  //     }

  //     const hashedPassword = await crypto.hash(password);
  //     const [user] = await db
  //       .insert(users)
  //       .values({ username, password: hashedPassword, role: "youtuber" })
  //       .returning();

  //     req.login(user, (err) => {
  //       if (err) {
  //         return res.status(500).send(err.message);
  //       }
  //       res.json(user);
  //     });
  //   } catch (error: any) {
  //     console.error("Registration error:", error);
  //     res.status(500).send(error.message);
  //   }
  // });

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
      const userToReturn = JSON.parse(JSON.stringify(req.user))
      delete userToReturn.password;
      return res.json(userToReturn);
    }
    res.status(401).send("No autenticado");
  });
}