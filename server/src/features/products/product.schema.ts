import { z } from "zod/v4";

const productCategoryEnum = z.enum([
  "electronics", "clothing", "food", "furniture", "tools", "other",
]);

const productStatusEnum = z.enum(["in_stock", "low_stock", "out_of_stock"]);

export const listProductsQuerySchema = z.object({
  q: z.string().optional(),
  category: productCategoryEnum.optional(),
  status: productStatusEnum.optional(),
  storeId: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.string().optional().describe("Format: field,direction (e.g. price,desc)"),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  category: productCategoryEnum,
  price: z.number(),
  quantity: z.number(),
  minStock: z.number(),
  status: productStatusEnum,
  storeId: z.number(),
  storeName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const productRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  category: productCategoryEnum,
  price: z.number(),
  quantity: z.number(),
  minStock: z.number(),
  status: productStatusEnum,
  storeId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

const linksSchema = z.object({
  self: z.string(),
  first: z.string(),
  prev: z.string().nullable(),
  next: z.string().nullable(),
  last: z.string(),
});

export const listProductsSchema = {
  tags: ["products"],
  querystring: listProductsQuerySchema,
  response: {
    200: z.object({
      data: z.array(productSchema),
      pagination: paginationSchema,
      links: linksSchema,
    }),
  },
};

export const getProductSchema = {
  tags: ["products"],
  params: z.object({ id: z.coerce.number() }),
  response: {
    200: z.object({ data: productSchema }),
  },
};

export const createProductBodySchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: productCategoryEnum,
  price: z.number().min(0),
  quantity: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  storeId: z.number(),
});

export const createProductSchema = {
  tags: ["products"],
  body: createProductBodySchema,
  response: {
    201: z.object({ data: productRowSchema }),
  },
};

export const updateProductBodySchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  category: productCategoryEnum.optional(),
  price: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  storeId: z.number().optional(),
});

export const updateProductSchema = {
  tags: ["products"],
  params: z.object({ id: z.coerce.number() }),
  body: updateProductBodySchema,
  response: {
    200: z.object({ data: productRowSchema }),
  },
};

export const deleteProductSchema = {
  tags: ["products"],
  params: z.object({ id: z.coerce.number() }),
  response: {
    204: z.undefined().describe("No content"),
  },
};
