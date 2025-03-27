import * as winston from 'winston';


export const logger = winston.createLogger({
    level: "info",
    format:winston.format.simple(),
    transports: [new winston.transports.Console()]

})
console.log("Hello from the console!");


logger.info("Hello world ---")
logger.log("info", "Hello world this is winston")