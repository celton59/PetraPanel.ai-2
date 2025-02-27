import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy - important for proper SSL handling
app.set('trust proxy', 1);

// Crear carpeta de uploads si no existe
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Middleware para loggear peticiones API
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log request details for debugging
  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);
  console.log('Headers:', req.headers);
  console.log('Protocol:', req.protocol);
  console.log('Secure:', req.secure);
  console.log('X-Forwarded-Proto:', req.get('x-forwarded-proto'));

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Track redirects
  const originalRedirect = res.redirect;
  res.redirect = function (...args) {
    console.log('Redirect detected:', {
      from: req.originalUrl,
      to: args[args.length - 1],
      status: typeof args[0] === 'number' ? args[0] : 302
    });
    return originalRedirect.apply(res, args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

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