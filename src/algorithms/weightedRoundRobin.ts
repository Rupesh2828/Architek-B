import { servers } from '../config/servers';

let currentIndex = 0;
let currentWeight = 0;

export const getNextServer = () => {
  const totalServers = servers.length;
  
  while (true) {
    currentIndex = (currentIndex + 1) % totalServers;
    
    if (currentIndex === 0) {
      currentWeight--;
      
      if (currentWeight <= 0) {
        currentWeight = Math.max(...servers.map(s => s.weight));
      }
    }
    
    if (servers[currentIndex].weight > 0) {
      return servers[currentIndex].url;
    }
  }
};