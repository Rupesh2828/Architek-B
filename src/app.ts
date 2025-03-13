import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send({ message: "Hello, world!" });
});

export default app;
