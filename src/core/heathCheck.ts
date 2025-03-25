// healthcheck.ts
import { servers } from "../config/servers";
import fetch from 'node-fetch';

export const checkServers = async () => {
  const healthChecks = servers.map(async (server) => {
    try {
      const response = await fetch(`${server.url}/health`, { 
        timeout: 3000  
      });
      
      if (response.ok) {
        console.log(`${server.url} is healthy`);
        server.weight = 1;  
      } else {
        console.log(`${server.url} returned non-200 status`);
        server.weight = 0;
      }
    } catch (error) {
      console.log(`${server.url} is down`);
      server.weight = 0;
    }
  });

  await Promise.all(healthChecks);
};


setInterval(checkServers, 10000);

checkServers();