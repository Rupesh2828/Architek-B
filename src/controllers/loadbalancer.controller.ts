import { Request, Response } from "express";
import { getNextServer } from "../algorithms/weightedRoundRobin";

export const getServer = (req: Request, res: Response) => {
    const server = getNextServer();
    res.json({ server });
};
