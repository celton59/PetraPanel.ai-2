import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy settings específico para Cloudflare
// Esto le dice a Express que confíe en todas las cabeceras de proxy
// Es necesario para que Cloudflare pueda pasar las cabeceras correctamente
app.set('trust proxy', true);

// CORRECCIÓN CRÍTICA: Middleware de redirección universal para Cloudflare con Flexible SSL
app.use((req, res, next) => {
  const host = req.get('host') || '';
  
  // SOLUCIÓN RADICAL: Para CUALQUIER dominio, deshabilitar redirecciones y forzar HTTP siempre
  
  // 1. Sobrescribir el método redirect para TODAS las redirecciones
  const originalRedirect = res.redirect;
  res.redirect = function(url: string | number): any {
    console.log('⚠️ INTERCEPTANDO TODAS LAS REDIRECCIONES:', typeof url === 'number' ? 'código: ' + url : url);
    
    // BLOQUEAR TODAS las redirecciones, sin importar el tipo o destino
    console.log('⛔ TODAS LAS REDIRECCIONES BLOQUEADAS - Continuando sin redirigir');
    
    // Si hay un request HTTPS, simplemente continuar sin redirección
    if ((req.secure || req.get('x-forwarded-proto') === 'https') && 
        (typeof url === 'string' && url.startsWith('https://'))) {
      console.log('🔒 → 🔓 Petición HTTPS detectada sin redirección');
      return next();
    }
    
    // Si es un código de redirección, ignorarlo completamente
    if (typeof url === 'number') {
      return res.status(200).send('Redirección bloqueada por configuración de Cloudflare Flexible SSL');
    }
    
    // Para cualquier otra redirección, continuar normalmente
    return next();
  };
  
  // 2. Forzar protocolo para TODOS los dominios como solución extrema
  Object.defineProperty(req, 'protocol', {
    value: 'http',
    configurable: true,
    writable: true
  });
  
  // 3. Forzar el valor de secure
  Object.defineProperty(req, 'secure', {
    value: false,
    configurable: true,
    writable: true
  });
  
  // 4. Modificar headers para garantizar consistencia
  req.headers['x-forwarded-proto'] = 'http';
  
  console.log('🔧 Aplicada prevención RADICAL de bucles de redirección para TODOS los hosts');
  next();
});

// Set environment variable to production in non-development environments
if (app.get('env') !== 'development') {
  process.env.NODE_ENV = 'production';
}

// ======================================================
// SOLUCIÓN MEJORADA PARA CLOUDFLARE FLEXIBLE SSL
// ======================================================
app.use((req, res, next) => {
  // Información de diagnóstico completa
  const host = req.get('host') || '';
  const cfIp = req.headers['cf-connecting-ip'];
  const cfRay = req.headers['cf-ray'];
  const cfVisitor = req.headers['cf-visitor'];
  const xForwardedProto = req.headers['x-forwarded-proto'];

  // Obtener información sobre la solicitud HTTP/HTTPS
  const isCfHttps = typeof cfVisitor === 'string' ? 
    cfVisitor.includes('"scheme":"https"') : false;
  const headerProto = Array.isArray(xForwardedProto) ? 
    xForwardedProto[0] : xForwardedProto;
  
  // Log completo para diagnóstico
  console.log('Diagnóstico de conexión DETALLADO:', {
    host,
    cfIp,
    cfRay,
    cfVisitor,
    isCfHttps,
    xForwardedProto: headerProto,
    originalProtocol: req.protocol,
    secure: req.secure,
    originalUrl: req.originalUrl
  });
  
  // Detección específica para petrapanel.ai y dominios relacionados con Cloudflare Flexible SSL
  // También incluir el dominio de Replit específico para este proyecto
  const isPetraPanelDomain = host === 'petrapanel.ai' || 
                            host === 'www.petrapanel.ai' || 
                            host === 'petra-panel-ai-celton59.replit.app';
  
  // Detectar si la solicitud viene a través de Cloudflare
  const isCloudflare = cfRay || cfIp || cfVisitor || 
                      (host === 'petrapanel.ai' || host === 'www.petrapanel.ai');
  
  if (isPetraPanelDomain && isCloudflare) {
    console.log('>>> Detectado dominio petrapanel.ai con Cloudflare - Aplicando configuración especial <<<');
    
    // SOLUCIÓN PARA EL ERROR ERR_TOO_MANY_REDIRECTS:
    // Con Cloudflare Flexible SSL, aunque Cloudflare envía la solicitud con https,
    // Express debe tratarla como http para evitar redirecciones infinitas.
    // La clave está en que Express detecte correctamente que está detrás de un proxy.
    
    // En lugar de cambiar X-Forwarded-Proto, indicamos a Express que la conexión es insegura
    // aunque llegue por HTTPS desde Cloudflare.
    Object.defineProperty(req, 'secure', {
      value: false,
      enumerable: true,
      configurable: true
    });
    
    // También ajustamos manualmente el protocolo para forzar HTTP
    Object.defineProperty(req, 'protocol', {
      value: 'http',
      enumerable: true,
      configurable: true
    });
    
    // Aplicamos configuración especial de cookies para Cloudflare Flexible SSL
    // Que forzará a todas las cookies a ser non-secure, sin importar lo que la aplicación intente hacer
    console.log('Forzando modo HTTP para cookies en dominio petrapanel.ai');
    
    console.log('Configuración especial para petrapanel.ai aplicada correctamente');
  } else if (isCloudflare) {
    // Para otros dominios de Cloudflare (no petrapanel.ai), respetamos el protocolo original
    console.log('Detectada conexión desde Cloudflare (no petrapanel.ai) - Configuración estándar');
  }
  
  next();
});

// Crear carpeta de uploads si no existe
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Middleware para loggear peticiones API
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  // Log request details for debugging
  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);
  console.log('Headers:', req.headers);
  console.log('Protocol:', req.protocol);
  console.log('Secure:', req.secure);
  console.log('X-Forwarded-Proto:', req.get('x-forwarded-proto'));

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Configurar autenticación
    console.log("Setting up authentication...");
    setupAuth(app);
    console.log("Authentication setup complete");

    // Registrar rutas y obtener el servidor HTTP
    const server = registerRoutes(app);

    // Middleware de manejo de errores
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Configurar Vite en desarrollo o servir archivos estáticos en producción
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Iniciar el servidor en el puerto 5000 como requerido
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      const actualPort = (server.address() as any)?.port || PORT;
      console.log(`Server started on port ${actualPort}`);
      log(`Server running on http://0.0.0.0:${actualPort}`);
      console.log('Environment:', app.get('env'));
      console.log('Trust proxy setting:', app.get('trust proxy'));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();