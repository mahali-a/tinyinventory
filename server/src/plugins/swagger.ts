import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export async function registerSwagger(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Tiny Store API",
        description: "Tiny Store inventory management API",
        version: "1.0.0",
      },
      tags: [
        { name: "dashboard", description: "Dashboard metrics" },
        { name: "stores", description: "Store management" },
        { name: "products", description: "Product management" },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });
}
