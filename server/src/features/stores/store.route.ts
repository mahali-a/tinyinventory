import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  listStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
} from "./store.service";
import {
  listStoresSchema,
  getStoreSchema,
  createStoreSchema,
  updateStoreSchema,
  deleteStoreSchema,
} from "./store.schema";

export const storeRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/stores", { schema: listStoresSchema }, async (request) =>
    listStores(request.query)
  );

  app.get("/stores/:id", { schema: getStoreSchema }, async (request) => ({
    data: getStore(request.params.id),
  }));

  app.post("/stores", { schema: createStoreSchema }, async (request, reply) => {
    const store = createStore(request.body);
    reply.header("Location", `/api/stores/${store.id}`);
    return reply.status(201).send({ data: store });
  });

  app.patch("/stores/:id", { schema: updateStoreSchema }, async (request) => ({
    data: updateStore(request.params.id, request.body),
  }));

  app.delete("/stores/:id", { schema: deleteStoreSchema }, async (request, reply) => {
    deleteStore(request.params.id);
    return reply.status(204).send();
  });
};
