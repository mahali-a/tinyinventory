import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./product.service";
import {
  listProductsSchema,
  getProductSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
} from "./product.schema";

export const productRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/products", { schema: listProductsSchema }, async (request) =>
    listProducts(request.query)
  );

  app.get("/products/:id", { schema: getProductSchema }, async (request) => ({
    data: getProduct(request.params.id),
  }));

  app.post("/products", { schema: createProductSchema }, async (request, reply) => {
    const product = createProduct(request.body);
    reply.header("Location", `/api/products/${product.id}`);
    return reply.status(201).send({ data: product });
  });

  app.patch("/products/:id", { schema: updateProductSchema }, async (request) => ({
    data: updateProduct(request.params.id, request.body),
  }));

  app.delete("/products/:id", { schema: deleteProductSchema }, async (request, reply) => {
    deleteProduct(request.params.id);
    return reply.status(204).send();
  });
};
