export interface Server {
    url: string;
    weight: number;
    current:number;
  }

export const servers:Server[] = [
    { url: "http://localhost:5001", weight: 3, current: 0 },
    { url: "http://localhost:5002", weight: 2, current: 0 },
    { url: "http://localhost:5003", weight: 1, current: 0 },
  ];
  