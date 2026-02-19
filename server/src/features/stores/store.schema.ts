import { z } from "zod/v4";

const storeStatusEnum = z.enum(["active", "inactive"]);

export const listStoresQuerySchema = z.object({
  q: z.string().optional(),
  status: storeStatusEnum.optional(),
  sort: z.string().optional().describe("Format: field,direction (e.g. name,asc)"),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const storeSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  manager: z.string(),
  status: storeStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const storeDetailSchema = storeSchema.extend({
  productSummary: z.object({
    total: z.number(),
    lowStock: z.number(),
    outOfStock: z.number(),
  }),
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

export const listStoresSchema = {
  tags: ["stores"],
  querystring: listStoresQuerySchema,
  response: {
    200: z.object({
      data: z.array(storeSchema),
      pagination: paginationSchema,
      links: linksSchema,
    }),
  },
};

export const getStoreSchema = {
  tags: ["stores"],
  params: z.object({ id: z.coerce.number() }),
  response: {
    200: z.object({ data: storeDetailSchema }),
  },
};

export const createStoreBodySchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  manager: z.string().min(1),
  status: storeStatusEnum.optional(),
});

export const createStoreSchema = {
  tags: ["stores"],
  body: createStoreBodySchema,
  response: {
    201: z.object({ data: storeSchema }),
  },
};

export const updateStoreBodySchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  manager: z.string().min(1).optional(),
  status: storeStatusEnum.optional(),
});

export const updateStoreSchema = {
  tags: ["stores"],
  params: z.object({ id: z.coerce.number() }),
  body: updateStoreBodySchema,
  response: {
    200: z.object({ data: storeSchema }),
  },
};

export const deleteStoreSchema = {
  tags: ["stores"],
  params: z.object({ id: z.coerce.number() }),
  response: {
    204: z.undefined().describe("No content"),
  },
};
