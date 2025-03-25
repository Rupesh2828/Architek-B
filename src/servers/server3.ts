import express from "express"
import { Request, Response } from "express";

const app = express();
const PORT = 5003;

app.get("/", (req: Request, res: Response)=> {
    res.send(`This is from ${PORT}`);
    
});

app.get("/health", (req: Request, res: Response)=> {
    res.sendStatus(200)
    
});


app.listen(PORT, () => console.log(`Server running on ${PORT}`));
