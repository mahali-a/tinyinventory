import { db } from "../../db/index";
import { products, stores } from "../../db/schema";
import type { InsertProduct, ProductCategory, ProductStatus } from "../../db/schema";
import { eq, like, and, gte, lte, count, sql, asc, desc } from "drizzle-orm";
import { NotFoundError, ConflictError } from "../../utils/errors";

function computeStatus(quantity: number, minStock: number): ProductStatus {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= minStock) return "low_stock";
  return "in_stock";
}

type ListProductsParams = {
  q?: string;
  category?: ProductCategory;
  status?: ProductStatus;
  storeId?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
};

function parseSortParam(sort?: string) {
  if (!sort) return { column: products.name, direction: asc };
  const [field, dir] = sort.split(",");
  const column =
    field === "price" ? products.price
    : field === "quantity" ? products.quantity
    : field === "sku" ? products.sku
    : field === "category" ? products.category
    : field === "status" ? products.status
    : field === "createdAt" ? products.createdAt
    : field === "storeName" ? stores.name
    : products.name;
  const direction = dir === "desc" ? desc : asc;
  return { column, direction };
}

export function listProducts(params: ListProductsParams) {
  const {
    q,
    category,
    status,
    storeId,
    minPrice,
    maxPrice,
    sort,
    page = 1,
    limit = 10,
  } = params;

  const conditions = [];
  if (q) {
    conditions.push(
      sql`(${like(products.name, `%${q}%`)} OR ${like(products.sku, `%${q}%`)})`
    );
  }
  if (category) conditions.push(eq(products.category, category));
  if (status) conditions.push(eq(products.status, status));
  if (storeId) conditions.push(eq(products.storeId, storeId));
  if (minPrice !== undefined) conditions.push(gte(products.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(products.price, maxPrice));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const { column, direction } = parseSortParam(sort);

  const data = db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      category: products.category,
      price: products.price,
      quantity: products.quantity,
      minStock: products.minStock,
      status: products.status,
      storeId: products.storeId,
      storeName: stores.name,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(where)
    .orderBy(direction(column))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  const [{ total }] = db
    .select({ total: count() })
    .from(products)
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
      self: `/api/products?page=${page}&limit=${limit}`,
      first: `/api/products?page=1&limit=${limit}`,
      prev: page > 1 ? `/api/products?page=${page - 1}&limit=${limit}` : null,
      next: page < totalPages ? `/api/products?page=${page + 1}&limit=${limit}` : null,
      last: `/api/products?page=${totalPages}&limit=${limit}`,
    },
  };
}

export function getProduct(id: number) {
  const product = db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      category: products.category,
      price: products.price,
      quantity: products.quantity,
      minStock: products.minStock,
      status: products.status,
      storeId: products.storeId,
      storeName: stores.name,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(eq(products.id, id))
    .get();

  if (!product) throw new NotFoundError("Product not found");
  return product;
}

export function createProduct(data: Omit<InsertProduct, "status">) {
  try {
    const status = computeStatus(data.quantity ?? 0, data.minStock ?? 10);
    return db
      .insert(products)
      .values({ ...data, status })
      .returning()
      .get();
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
      throw new ConflictError(`SKU '${data.sku}' already exists`);
    }
    throw err;
  }
}

export function updateProduct(id: number, data: Partial<Omit<InsertProduct, "status">>) {
  const existing = db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .get();
  if (!existing) throw new NotFoundError("Product not found");

  const quantity = data.quantity ?? existing.quantity;
  const minStock = data.minStock ?? existing.minStock;
  const status = computeStatus(quantity, minStock);

  try {
    return db
      .update(products)
      .set({ ...data, status, updatedAt: new Date().toISOString() })
      .where(eq(products.id, id))
      .returning()
      .get();
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
      throw new ConflictError(`SKU '${data.sku}' already exists`);
    }
    throw err;
  }
}

export function deleteProduct(id: number) {
  const existing = db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .get();
  if (!existing) throw new NotFoundError("Product not found");

  db.delete(products).where(eq(products.id, id)).run();
}
