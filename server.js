import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { connectDatabase } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import paymentRoutes from "./src/routes/payments.js";
import progressRoutes from "./src/routes/progress.js";
const app = express(),
  here = dirname(fileURLToPath(import.meta.url)),
  port = Number(process.env.PORT) || 8000;
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
  }),
);
app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/progress", progressRoutes);
app.use(express.static(join(here, "public"), { extensions: ["html"] }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error" });
});
connectDatabase()
  .then(() =>
    app.listen(port, () =>
      console.log(`DSA Visual Lab running on port ${port}`),
    ),
  )
  .catch((e) => {
    console.error("Startup failed:", e.message);
    process.exit(1);
  });
