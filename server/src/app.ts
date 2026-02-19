import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { registerCors } from "./plugins/cors";
import { registerSwagger } from "./plugins/swagger";
import { registerErrorHandler } from "./plugins/error-handler";
import { dashboardRoutes } from "./features/dashboard/dashboard.route";
import { storeRoutes } from "./features/stores/store.route";
import { productRoutes } from "./features/products/product.route";

export async function buildApp() {
  const app = Fastify({ logger: true });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registerErrorHandler(app);
  await registerCors(app);
  await registerSwagger(app);

  app.get("/health", async () => ({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  await app.register(dashboardRoutes, { prefix: "/api" });
  await app.register(storeRoutes, { prefix: "/api" });
  await app.register(productRoutes, { prefix: "/api" });

  return app;
}
