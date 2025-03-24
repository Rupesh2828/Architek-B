import express from "express";
import cors from "cors";
import { faker } from "@faker-js/faker";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/user/:id", (req, res) => {

  const {id} = req.params;


  const user = {
    id,
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }

  res.json(user)
  
});

import userRouter from "./routes/user.route"

app.use("/api/v1/users", userRouter)

export default app;
