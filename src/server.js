import express from "express";
import cors from "cors";
import helmet from "helmet";

import { router as apiRouter } from "./routes/index.js";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/mongoDB.js";
import { limiter } from "./middelware/rateLimit.js";

const corsOption = {
  origin: [
    "https://kinetix-qnx5.onrender.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
  ],
};

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cookieParser());
app.use(cors(corsOption));
app.use(express.json());
app.use(limiter);

app.get("/", (req, res) => {
  res.send("Welcome to Kinetix");
});

// http://localhost:5000/api
app.use("/api", apiRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  const response = {
    success: false,
    message: err.message || "Server is error!",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  res.status(err.status || 500).json(response);
});

await connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on Port: ${PORT} !!`);
});
