import "dotenv/config";
import Height from "height-app-api";
import { mongoConnect } from "./database.js";

await mongoConnect(); // connect to DB

export const height = new Height({ secretKey: process.env.HEIGHT_API_KEY });
