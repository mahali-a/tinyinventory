import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { stores, products } from "./schema";
import { config } from "../config";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { sql } from "drizzle-orm";

mkdirSync(dirname(config.DATABASE_URL), { recursive: true });

const sqlite = new Database(config.DATABASE_URL);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

db.run(sql`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    manager TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(sql`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'in_stock',
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.delete(products).run();
db.delete(stores).run();

const storeData = [
  { name: "Kofi Tech Hub", location: "Oxford St, Osu, Accra", manager: "Kofi Mensah", status: "active" as const },
  { name: "Ama's Furniture & Home", location: "Ring Rd Central, Accra", manager: "Ama Asante", status: "active" as const },
  { name: "Kantamanto Fashion", location: "Kantamanto Market, Accra", manager: "Abena Owusu", status: "active" as const },
  { name: "Kwame General Provisions", location: "Kejetia Market, Kumasi", manager: "Kwame Boateng", status: "active" as const },
  { name: "Adwoa's Corner Shop", location: "Labone, Accra", manager: "Adwoa Darko", status: "inactive" as const },
];

const insertedStores = storeData.map((s) =>
  db.insert(stores).values(s).returning().get()
);

function computeStatus(quantity: number, minStock: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= minStock) return "low_stock";
  return "in_stock";
}

const productData = [
  { name: "MacBook Pro 16\"", sku: "MBP16-2024", category: "electronics" as const, price: 2499.99, quantity: 15, minStock: 5, storeId: insertedStores[0].id },
  { name: "iPhone 15 Pro", sku: "IPH15PRO", category: "electronics" as const, price: 999.99, quantity: 42, minStock: 10, storeId: insertedStores[0].id },
  { name: "AirPods Pro (2nd gen)", sku: "APP2-BLK", category: "electronics" as const, price: 249.99, quantity: 3, minStock: 15, storeId: insertedStores[0].id },
  { name: "iPad Air 5", sku: "IPAD-AIR5", category: "electronics" as const, price: 599.99, quantity: 0, minStock: 8, storeId: insertedStores[0].id },
  { name: "Apple Watch Ultra 2", sku: "AWU2", category: "electronics" as const, price: 799.99, quantity: 28, minStock: 10, storeId: insertedStores[0].id },
  { name: "USB-C Hub 7-in-1", sku: "USBC-HUB7", category: "electronics" as const, price: 49.99, quantity: 100, minStock: 20, storeId: insertedStores[0].id },
  { name: "Magic Keyboard (Touch ID)", sku: "MK-TOUCHID", category: "electronics" as const, price: 199.99, quantity: 8, minStock: 10, storeId: insertedStores[0].id },
  { name: "DisplayPort Cable 2m", sku: "DP-2M", category: "electronics" as const, price: 19.99, quantity: 74, minStock: 25, storeId: insertedStores[0].id },
  { name: "Mesh Office Chair", sku: "OFC-CHAIR-01", category: "furniture" as const, price: 379.00, quantity: 4, minStock: 3, storeId: insertedStores[0].id },

  { name: "Standing Desk 140cm", sku: "DESK-SIT-STAND-140", category: "furniture" as const, price: 699.99, quantity: 12, minStock: 5, storeId: insertedStores[1].id },
  { name: "Ergonomic Chair Pro", sku: "CHR-ERG-PRO", category: "furniture" as const, price: 449.99, quantity: 0, minStock: 8, storeId: insertedStores[1].id },
  { name: "Bookshelf (Oak, 5 shelf)", sku: "BSHELF-OAK5", category: "furniture" as const, price: 299.99, quantity: 25, minStock: 10, storeId: insertedStores[1].id },
  { name: "Cordless Drill 18V", sku: "DRILL-18V-BOSH", category: "tools" as const, price: 129.99, quantity: 35, minStock: 10, storeId: insertedStores[1].id },
  { name: "Circular Saw 7.25\"", sku: "SAW-CIRC-725", category: "tools" as const, price: 199.99, quantity: 4, minStock: 5, storeId: insertedStores[1].id },
  { name: "Metric Wrench Set (8pc)", sku: "WR-8PC-MET", category: "tools" as const, price: 79.99, quantity: 50, minStock: 15, storeId: insertedStores[1].id },

  { name: "Denim Jacket (M)", sku: "JKT-DNM-M", category: "clothing" as const, price: 89.99, quantity: 60, minStock: 20, storeId: insertedStores[2].id },
  { name: "Running Shoes - Size 42", sku: "SHOE-RUN-42", category: "clothing" as const, price: 129.99, quantity: 2, minStock: 15, storeId: insertedStores[2].id },
  { name: "Cotton T-Shirt 3-Pack (L)", sku: "TEE-3PK-L", category: "clothing" as const, price: 34.99, quantity: 200, minStock: 50, storeId: insertedStores[2].id },
  { name: "Winter Parka (XL)", sku: "PRKA-XL-NVY", category: "clothing" as const, price: 259.99, quantity: 0, minStock: 10, storeId: insertedStores[2].id },
  { name: "Silk Scarf (Floral)", sku: "SCARF-SILK-FLR", category: "clothing" as const, price: 49.99, quantity: 45, minStock: 20, storeId: insertedStores[2].id },
  { name: "Leather Belt 32\"", sku: "BLT-LTR-32", category: "clothing" as const, price: 39.99, quantity: 80, minStock: 25, storeId: insertedStores[2].id },
  { name: "Merino Wool Sweater (S)", sku: "SWR-MRN-S", category: "clothing" as const, price: 79.99, quantity: 13, minStock: 15, storeId: insertedStores[2].id },
  { name: "Snap-back Cap", sku: "CAP-SNAP-BLK", category: "clothing" as const, price: 24.99, quantity: 37, minStock: 10, storeId: insertedStores[2].id },

  { name: "Organic Coffee Beans 1kg", sku: "COF-ORG-1KG", category: "food" as const, price: 18.99, quantity: 150, minStock: 30, storeId: insertedStores[3].id },
  { name: "Extra Virgin Olive Oil 500ml", sku: "OIL-EVO-500", category: "food" as const, price: 12.99, quantity: 5, minStock: 20, storeId: insertedStores[3].id },
  { name: "Dark Chocolate Assortment", sku: "CHOC-DRK-AST", category: "food" as const, price: 24.99, quantity: 75, minStock: 25, storeId: insertedStores[3].id },
  { name: "Whey Protein Bars (24pk)", sku: "PBAR-WHY-24", category: "food" as const, price: 29.99, quantity: 0, minStock: 15, storeId: insertedStores[3].id },
  { name: "Sencha Green Tea (40 bags)", sku: "TEA-GRN-40", category: "food" as const, price: 14.99, quantity: 90, minStock: 20, storeId: insertedStores[3].id },
  { name: "JBL Clip 4 Speaker", sku: "JBL-CLIP4-RED", category: "electronics" as const, price: 79.99, quantity: 22, minStock: 10, storeId: insertedStores[3].id },
  { name: "Anker 20000mAh Powerbank", sku: "ANKR-PB-20K", category: "electronics" as const, price: 49.99, quantity: 9, minStock: 10, storeId: insertedStores[3].id },

  { name: "Vintage Table Lamp", sku: "LAMP-VTG-BRS", category: "furniture" as const, price: 149.99, quantity: 3, minStock: 5, storeId: insertedStores[4].id },
  { name: "Canvas Backpack 30L", sku: "BAG-CNV-30L", category: "clothing" as const, price: 54.99, quantity: 11, minStock: 10, storeId: insertedStores[4].id },
  { name: "Mixed Dried Fruit 500g", sku: "FRUIT-DRY-500", category: "food" as const, price: 9.99, quantity: 0, minStock: 10, storeId: insertedStores[4].id },
  { name: "Soy Pillar Candles (set of 4)", sku: "CNDL-SOY-4PK", category: "other" as const, price: 22.99, quantity: 30, minStock: 15, storeId: insertedStores[4].id },
  { name: "A5 Notebook 3-Pack", sku: "NB-A5-3PK", category: "other" as const, price: 15.99, quantity: 12, minStock: 10, storeId: insertedStores[4].id },
];

for (const p of productData) {
  const status = computeStatus(p.quantity, p.minStock);
  db.insert(products).values({ ...p, status }).run();
}

console.log(`Seeded ${storeData.length} stores and ${productData.length} products.`);
sqlite.close();
