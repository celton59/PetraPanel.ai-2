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
  
  // La configuración base para todos los dominios - SIMPLIFICADA AL MÁXIMO
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "petra-panel-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // 24 horas
    }),
    proxy: true, // Esencial para entornos con proxies como Cloudflare
    // Configuración ultra-básica para cookies - COMPATIBLE UNIVERSAL
    cookie: {
      httpOnly: false, // Permitir acceso JS
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      path: '/',
      sameSite: 'none', // Permitir cross-site más amplio
      secure: false, // NUNCA secure para evitar problemas de SSL
    }
  };
  
  // Actualización importante: log de nuestra configuración final de cookie
  console.log('Configuración de cookie de sesión:', {
    httpOnly: sessionSettings.cookie?.httpOnly,
    secure: sessionSettings.cookie?.secure,
    sameSite: sessionSettings.cookie?.sameSite,
    proxy: sessionSettings.proxy
  });
  
  // Middleware especial para configurar las cookies según el dominio
  // En lugar de modificar sessionOptions que no está disponible en el tipo Request,
  // modificaremos la configuración global según el dominio identificado
  app.use((req, res, next) => {
    const host = req.get('host') || '';
    const isPetraPanelDomain = host === 'petrapanel.ai' || 
                            host === 'www.petrapanel.ai' || 
                            host === 'petra-panel-ai-celton59.replit.app';
    
    const isCloudflare = req.headers['cf-ray'] || 
                        req.headers['cf-connecting-ip'] || 
                        req.headers['cf-visitor'] ||
                        host === 'petrapanel.ai' || 
                        host === 'www.petrapanel.ai';
    
    // Aplicamos configuración especial para el dominio de petrapanel.ai o replit
    if (isPetraPanelDomain) {
      console.log('Configurando sesión para dominio:', host, '(Cloudflare Flexible SSL)');
      
      // Para Cloudflare Flexible SSL: asegurar que secure=false, incluso en HTTPS
      if (sessionSettings.cookie) {
        sessionSettings.cookie.secure = false;
        
        // Configurar el dominio correctamente para que funcione con/sin www
        sessionSettings.cookie.domain = host.includes('www.') 
          ? host.substring(4) 
          : host;
        
        console.log('Configuración especial de cookie aplicada para:', host, {
          domain: sessionSettings.cookie.domain,
          secure: sessionSettings.cookie.secure,
          sameSite: sessionSettings.cookie.sameSite
        });
      }
      
      // Para el dominio de petrapanel.ai, configuramos cookies no seguras
      // La implementación específica se maneja en el middleware del servidor
      console.log('Configuración especial para cookies en petrapanel.ai');
    } else {
      // Para desarrollo en Replit u otros entornos
      console.log('Usando configuración estándar de cookies para:', host);
    }
    
    next();
  });

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

  // Versión especial mucho más permisiva para entornos con problemas de Cloudflare
  app.post("/api/login", (req, res, next) => {
    console.log("⚡ INTENTANDO LOGIN PARA:", req.body?.username);
    
    // Interceptar para dar más flexibilidad al proceso de autenticación
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Error grave en autenticación:", err);
        return res.status(500).json({ success: false, message: "Error interno" });
      }
      
      if (!user) {
        console.error("Falló autenticación:", info?.message || "Usuario o contraseña incorrectos");
        return res.status(401).json({ success: false, message: info?.message || "Usuario o contraseña incorrectos" });
      }
      
      // LOGIN MANUAL para evitar problemas con cookies/sesión
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Error al establecer la sesión:", loginErr);
          return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
        }
        
        console.log("🔑 LOGIN EXITOSO para usuario:", user.username, "con ID:", user.id);
        
        // Devolver el usuario con un token adicional para más seguridad
        res.json({
          ...user,
          _sessionValid: true,
          _timestamp: Date.now()
        });
      });
    })(req, res, next);
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

  // Versión ultra-permisiva de la verificación de usuario
  app.get("/api/user", (req, res) => {
    console.log("📊 DIAGNÓSTICO DE SESIÓN:", {
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      sessionID: req.sessionID,
      hasCookies: !!req.headers.cookie,
      host: req.get('host'),
      protocol: req.protocol,
      originalProtocol: req.get('x-forwarded-proto')
    });
    
    // Si el usuario está autenticado normalmente
    if (req.isAuthenticated() && req.user) {
      console.log("✅ Usuario autenticado normalmente:", req.user.username);
      return res.json({
        ...req.user,
        _sessionValid: true,
        _timestamp: Date.now()
      });
    }
    
    // SOLUCIÓN TEMPORAL: Si hay un problema de Cloudflare pero tenemos sesión
    if (req.sessionID && req.headers.cookie?.includes('connect.sid')) {
      console.log("⚠️ Detectada cookie de sesión pero falló autenticación - Investigando...");
      
      // Esto podría ayudar a recuperar la sesión en algunos casos de fallo
      // pero no lo implementamos ahora para no complicar más la solución
      
      console.log("❌ No se pudo recuperar la sesión");
    }
    
    // Si todo falla, indicar que no está autenticado
    res.status(401).json({
      message: "No autenticado",
      _debug: {
        sessionID: req.sessionID,
        hasCookies: !!req.headers.cookie,
        timestamp: new Date().toISOString()
      }
    });
  });
}