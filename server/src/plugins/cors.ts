import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";
import { config } from "../config";

export async function registerCors(app: FastifyInstance) {
  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });
}
