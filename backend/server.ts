import config from "./shared/config";
import express from "express";
import errorHandler from "./shared/middlewares/errorHandler";

const app = express();
const { port } = config;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: "not found" });
});

app.use(errorHandler);

app.listen(port, "0.0.0.0");
