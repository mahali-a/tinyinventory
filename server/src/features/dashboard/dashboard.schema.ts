import { z } from "zod/v4";

export const dashboardMetricsSchema = {
  tags: ["dashboard"],
  response: {
    200: z.object({
      data: z.object({
        totalStores: z.number(),
        activeStores: z.number(),
        totalProducts: z.number(),
        inventoryValue: z.number(),
        lowStockCount: z.number(),
        outOfStockCount: z.number(),
        categoryCounts: z.record(z.string(), z.number()),
        lowStockProducts: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            sku: z.string(),
            quantity: z.number(),
            minStock: z.number(),
            status: z.string(),
            storeName: z.string(),
          })
        ),
      }),
    }),
  },
};
