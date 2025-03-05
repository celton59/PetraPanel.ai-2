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
  
  // La configuración de sesión optimizada para formularios tradicionales
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "petra-panel-secret-key-optimized",
    resave: true, // Cambiado a true para forzar resguardar la sesión
    saveUninitialized: true, // Cambiado para asegurar que la sesión se guarde
    name: 'petra_session', // Nombre personalizado para evitar detección de bots
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
      stale: false, // No usar sesiones antiguas
      ttl: 86400 // 1 día en segundos
    }),
    proxy: true, // Mantener proxy para manejar las cabeceras correctamente
    rolling: true // Renovar la cookie en cada petición
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Authenticating user:", username);
        console.log("Authentication type: Traditional Form");
        
        // Validación básica de entrada
        if (!username || !password) {
          console.error("Missing username or password");
          return done(null, false, { message: "Nombre de usuario y contraseña son requeridos" });
        }
        
        console.log(`Buscando usuario: ${username}`);
        
        // Buscar usuarios ignorando mayúsculas/minúsculas
        const usersResult = await db
          .select()
          .from(users);
          
        if (!usersResult || usersResult.length === 0) {
          console.error("No users found in database");
          return done(null, false, { message: "No se encontraron usuarios en la base de datos" });
        }
        
        console.log(`Se encontraron ${usersResult.length} usuarios`);
        
        // Filtrar manualmente para encontrar la coincidencia insensible a mayúsculas/minúsculas
        const user = usersResult.find(u => 
          u.username.toLowerCase() === username.toLowerCase() ||
          u.username.charAt(0).toUpperCase() + u.username.slice(1) === username ||
          u.username.charAt(0).toLowerCase() + u.username.slice(1) === username
        );

        if (!user) {
          console.error(`Usuario ${username} no encontrado`);
          return done(null, false, { message: "Usuario no encontrado" });
        }
        
        console.log(`Usuario ${username} encontrado, verificando contraseña`);

        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          console.error(`Contraseña incorrecta para usuario ${username}`);
          return done(null, false, { message: "Contraseña incorrecta" });
        }
        
        console.log(`Autenticación exitosa para ${username}`);
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

  app.post("/api/login", (req, res, next) => {
    console.log("=== INICIO DIAGNÓSTICO DE LOGIN ===");
    console.log("Dirección IP:", req.ip);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Método de la petición:", req.method);
    console.log("Tipo de contenido:", req.headers['content-type']);
    console.log("Cuerpo de la petición:", req.body);
    console.log("Cookies:", req.headers.cookie);
    console.log("URL completa:", req.url);
    console.log("=== FIN DIAGNÓSTICO DE LOGIN ===");
    
    // Verificar que los datos del formulario estén presentes
    if (!req.body || !req.body.username || !req.body.password) {
      console.error("Error: Faltan datos del formulario");
      return res.redirect('/?error=missing_form_data');
    }
    
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Login error:", err);
        return res.redirect('/?error=server_error');
      }
      
      if (!user) {
        console.error("Credenciales incorrectas:", info?.message);
        return res.redirect('/?error=invalid_credentials');
      }
      
      req.login(user, (loginErr: any) => {
        if (loginErr) {
          console.error("Session error:", loginErr);
          return res.redirect('/?error=session_error');
        }
        
        console.log("Login successful for user:", user.username);
        console.log("Session ID:", req.sessionID);
        console.log("Cookie settings:", req.session.cookie);
        
        // Asegurar que la cookie de sesión se establezca correctamente
        // Configurar opciones de cookie manualmente
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
        req.session.cookie.httpOnly = true;
        req.session.cookie.secure = false; // Importante para Cloudflare Flexible
        req.session.cookie.path = '/';
        
        // Guardar la sesión explícitamente
        req.session.save((err) => {
          if (err) {
            console.error("Error al guardar la sesión:", err);
            return res.redirect('/?error=session_save_error');
          }
          
          console.log("Sesión guardada correctamente");
          console.log("Redirigiendo a /");
          
          // Redirección directa (sin JSON para formularios tradicionales)
          return res.redirect('/');
        });
      });
    })(req, res, next);
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
    console.log("=== INICIO DIAGNÓSTICO DE LOGOUT ===");
    console.log("Dirección IP:", req.ip);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Método de la petición:", req.method);
    console.log("Tipo de contenido:", req.headers['content-type']);
    console.log("Cookies:", req.headers.cookie);
    console.log("URL completa:", req.url);
    console.log("Usuario autenticado:", req.isAuthenticated());
    console.log("=== FIN DIAGNÓSTICO DE LOGOUT ===");
    
    const username = req.user?.username;
    console.log("Cerrando sesión para usuario:", username);
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error for user:", username, err);
        return res.redirect('/?error=logout_error');
      }
      
      console.log("User logged out successfully:", username);
      console.log("Redirigiendo al inicio después del logout");
      
      // Limpiar la cookie de sesión
      res.clearCookie('connect.sid');
      
      // Simplificar usando solo redirección directa
      return res.redirect('/');
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("No autenticado");
  });
}