import http from "http";
import { createProxyServer } from "http-proxy";
import { getNextServer } from "../algorithms/weightedRoundRobin";

const proxy = createProxyServer();

export const startProxy = () => {
  const server = http.createServer((req, res) => {
    const target = getNextServer();
    console.log(`Routing request to: ${target}`);

    proxy.web(req, res, { target }, (err) => {
      console.error(`Failed to route to ${target}:`, err);
      res.writeHead(502);
      res.end("Bad Gateway");
    });
  });

  server.listen(8000, () => console.log("Load Balancer running on port 8000"));
};
