// server.ts
import app from "./app";
import prisma from "./config/database";
import { startProxy } from "./core/proxy";
import "./core/heathCheck";  // Health check
import { servers } from "./config/servers";
import express from "express";

const PORT = process.env.PORT ?? 4000;

async function startServer(serverConfig: { port: number, app: express.Application }) {
  return new Promise<void>((resolve, reject) => {
    serverConfig.app.get("/", (_, res) => {
        res.send(`Server on ${serverConfig.port}`)
    });
    serverConfig.app.get("/health", (_, res) => {
        res.sendStatus(200)
    });

    serverConfig.app.listen(serverConfig.port, () => {
      console.log(`Server running on port ${serverConfig.port}`);
      resolve();
    }).on('error', (err) => {
      console.error(`Failed to start server on port ${serverConfig.port}:`, err);
      reject(err);
    });
  });
}

async function main() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log("Connected to Postgres!");

    // Start main server
    app.listen(PORT, () => {
      console.log(`Main server running on PORT: ${PORT}`);
    });

    // Start additional servers
    // const additionalServers = servers.map(server => 
    //   startServer({ 
    //     port: parseInt(new URL(server.url).port), 
    //     app: express() 
    //   })
    // );

    // await Promise.all(additionalServers);

    // Start proxy
    startProxy();

  } catch (error) {
    console.error("Initialization failed:", error);
    process.exit(1);
  }
}

main();