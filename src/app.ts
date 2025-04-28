import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";

import { sessionMiddleware } from "./config/session";
import { contextMiddleware } from "./middlewares/context";
import { swaggerSpec } from "./swagger/swagger";

import userRouter from "./routes/user.route";
import orgRouter from "./routes/organization.route";
import loadBalancerRouter from "./routes/loadbalancer.route";

const app = express();

app.use(helmet());
app.use(compression());

app.use(sessionMiddleware); 
app.use(contextMiddleware);

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));

//swagger doc
app.get('/api-docs-json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/org", orgRouter);
app.use("/api/v2/loadbalancer", loadBalancerRouter);

export default app;
