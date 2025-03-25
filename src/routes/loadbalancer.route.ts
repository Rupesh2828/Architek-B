import { Router } from "express";
import { getServer } from "../controllers/loadbalancer.controller";

const router = Router();

router.get("/", getServer); // Load Balancer route


export default router;
