import { db } from "../../db/index";
import { stores, products } from "../../db/schema";
import type { InsertStore, StoreStatus } from "../../db/schema";
import { eq, like, and, count, sql, asc, desc } from "drizzle-orm";
import { NotFoundError } from "../../utils/errors";

type ListStoresParams = {
  q?: string;
  status?: StoreStatus;
  sort?: string;
  page?: number;
  limit?: number;
};

function parseSortParam(sort?: string) {
  if (!sort) return { column: stores.name, direction: asc };
  const [field, dir] = sort.split(",");
  const column =
    field === "location" ? stores.location
    : field === "manager" ? stores.manager
    : field === "status" ? stores.status
    : field === "createdAt" ? stores.createdAt
    : stores.name;
  const direction = dir === "desc" ? desc : asc;
  return { column, direction };
}

export function listStores(params: ListStoresParams) {
  const { q, status, sort, page = 1, limit = 10 } = params;

  const conditions = [];
  if (q) conditions.push(like(stores.name, `%${q}%`));
  if (status) conditions.push(eq(stores.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const { column, direction } = parseSortParam(sort);

  const data = db
    .select()
    .from(stores)
    .where(where)
    .orderBy(direction(column))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  const [{ total }] = db
    .select({ total: count() })
    .from(stores)
    .where(where)
    .all();

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    links: {
      self: `/api/stores?page=${page}&limit=${limit}`,
      first: `/api/stores?page=1&limit=${limit}`,
      prev: page > 1 ? `/api/stores?page=${page - 1}&limit=${limit}` : null,
      next: page < totalPages ? `/api/stores?page=${page + 1}&limit=${limit}` : null,
      last: `/api/stores?page=${totalPages}&limit=${limit}`,
    },
  };
}

export function getStore(id: number) {
  const store = db.select().from(stores).where(eq(stores.id, id)).get();
  if (!store) throw new NotFoundError("Store not found");

  const productSummary = db
    .select({
      total: count(),
      lowStock: count(
        sql`CASE WHEN ${products.status} = 'low_stock' THEN 1 END`
      ),
      outOfStock: count(
        sql`CASE WHEN ${products.status} = 'out_of_stock' THEN 1 END`
      ),
    })
    .from(products)
    .where(eq(products.storeId, id))
    .get() ?? { total: 0, lowStock: 0, outOfStock: 0 };

  return { ...store, productSummary };
}

export function createStore(data: InsertStore) {
  return db.insert(stores).values(data).returning().get();
}

export function updateStore(id: number, data: Partial<InsertStore>) {
  const existing = db.select().from(stores).where(eq(stores.id, id)).get();
  if (!existing) throw new NotFoundError("Store not found");

  return db
    .update(stores)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(stores.id, id))
    .returning()
    .get();
}

export function deleteStore(id: number) {
  const existing = db.select().from(stores).where(eq(stores.id, id)).get();
  if (!existing) throw new NotFoundError("Store not found");

  db.delete(stores).where(eq(stores.id, id)).run();
}
