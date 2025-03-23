import app from "./app";
import prisma from "./config/database";

const PORT = process.env.PORT ?? 4000;


async function server() {
    try {
        await prisma.$connect();
        console.log("Connected to Postgres!");
        

        app.listen(PORT, () => {
            console.log(`Server is running on PORT: ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1); 
    }
}

server();