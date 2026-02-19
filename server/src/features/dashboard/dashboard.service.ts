import { db } from "../../db/index";
import { stores, products } from "../../db/schema";
import { sql, eq, count, sum } from "drizzle-orm";

export function getDashboardMetrics() {
  const [storeCount] = db
    .select({ count: count() })
    .from(stores)
    .all();

  const [activeStoreCount] = db
    .select({ count: count() })
    .from(stores)
    .where(eq(stores.status, "active"))
    .all();

  const [productCount] = db
    .select({ count: count() })
    .from(products)
    .all();

  const [inventoryValue] = db
    .select({
      total: sum(sql`${products.price} * ${products.quantity}`),
    })
    .from(products)
    .all();

  const [lowStockCount] = db
    .select({ count: count() })
    .from(products)
    .where(eq(products.status, "low_stock"))
    .all();

  const [outOfStockCount] = db
    .select({ count: count() })
    .from(products)
    .where(eq(products.status, "out_of_stock"))
    .all();

  const categoryCounts = db
    .select({
      category: products.category,
      count: count(),
    })
    .from(products)
    .groupBy(products.category)
    .all();

  const lowStockProducts = db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      quantity: products.quantity,
      minStock: products.minStock,
      status: products.status,
      storeName: stores.name,
    })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(
      sql`${products.status} IN ('low_stock', 'out_of_stock')`
    )
    .orderBy(products.quantity)
    .all();

  return {
    totalStores: storeCount.count,
    activeStores: activeStoreCount.count,
    totalProducts: productCount.count,
    inventoryValue: Number(inventoryValue.total) || 0,
    lowStockCount: lowStockCount.count,
    outOfStockCount: outOfStockCount.count,
    categoryCounts: Object.fromEntries(
      categoryCounts.map((c) => [c.category, c.count])
    ),
    lowStockProducts,
  };
}
