import config from "./shared/config";
import express from "express";
import cookieParser from "cookie-parser";
import errorHandler from "./shared/middlewares/errorHandler";
import authRouter from "./modules/auth/routes/auth.routes";
import logger from "./shared/config/logger";
import helmet from "helmet";
import cors from "cors";
import ResponseFormatter from "./shared/utils/responseFormatter";
import { getPool } from "./shared/db";

const app = express();
const { port } = config;

/**
 * Middleware
 */
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  next();
});

/**
 * health check endpoint
 */
app.get("/health", (_req, res) => {
  res.status(200).json(
    ResponseFormatter.success(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      "Service is healthy",
    ),
  );
});

/**
 * API Routes
 */
app.use("/auth", authRouter);

/**
 * 404 handler
 */
app.use((_req, res) => {
  res.status(404).json({ error: "not found" });
});

app.use(errorHandler);

async function startServer() {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    logger.info("Database connected");

    const server = app.listen(port, "0.0.0.0", () => {
      logger.info(`Server started on port ${port}`);
      logger.info(`Environment: ${config.node_env}`);
    });

    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async (err) => {
        if (err) {
          logger.error("Error closing HTTP server", err);
          process.exit(1);
        }

        logger.info("HTTP server closed");
        try {
          await pool.end();
          logger.info("Database pool closed, exiting");
          process.exit(0);
        } catch (error) {
          logger.error("Error closing database pool", error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", error);
      gracefulShutdown("uncaughtException");
    });
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection", { reason });
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
