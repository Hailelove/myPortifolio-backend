import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import contactRoutes from "./modules/contact/contact.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

const app = express();

// const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim());

app.use(helmet());

app.use(
  cors({
    // origin: allowedOrigins,
    origin: "http://localhost:5173/, https://demeportfolio.com",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-setup-key"],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Portfolio API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

export default app;
