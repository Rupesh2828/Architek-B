import express from "express";
import cors from "cors";
import { faker } from "@faker-js/faker";
import { sessionMiddleware } from "./config/session";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(sessionMiddleware)

import userRouter from "./routes/user.route"

app.use("/api/v1/users", userRouter)

export default app;
