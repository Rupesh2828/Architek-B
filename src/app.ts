import express from "express";
import cors from "cors";
import { sessionMiddleware } from "./config/session";
import helmet from "helmet";
import compression from "compression"
import { contextMiddleware } from "./middlewares/context";

const app = express();

app.use(sessionMiddleware)
app.use(contextMiddleware)

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

//helmet is security header along with Gzip compression
app.use(helmet())
app.use(compression())

app.use(express.json({ limit: "50mb" }));

import userRouter from "./routes/user.route"
import orgRouter from "./routes/organization.route"
import loadBalancerRouter from "./routes/loadbalancer.route"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/org", orgRouter)
app.use("/api/v2/loadbalancer", loadBalancerRouter);

export default app;
