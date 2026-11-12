// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import cookieParser from "cookie-parser";

// import { env } from "./config/env.js";
// import authRoutes from "./modules/auth/auth.routes.js";
// import { errorHandler } from "./middleware/error.middleware.js";
// import contactRoutes from "./modules/contact/contact.routes.js";
// import adminRoutes from "./modules/admin/admin.routes.js";

// const app = express();

// const allowedOrigins = [
//   "https://demeportfolio.neyasoft.com",
//   "http://localhost:5173",
// ];

// app.use(helmet());

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Allow requests with no origin (like mobile apps, curl, or postman)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         const msg =
//           "The CORS policy for this site does not allow access from the specified Origin.";
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization", "x-admin-setup-key"],
//   }),
// );

// app.use(express.json({ limit: "1mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// app.get("/api/health", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Portfolio API is running",
//   });
// });

// app.use("/api/auth", authRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/admin", adminRoutes);

// app.use(errorHandler);

// export default app;
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

const allowedOrigins = [
  "https://demeportfolio.neyasoft.com",
  "http://localhost:5173",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-setup-key"],
  optionsSuccessStatus: 204,
};

app.use(helmet());
app.use(cors(corsOptions));
export default app;
