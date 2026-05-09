import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "db.json");

function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { items: [], stock_transactions: [], receivings: [], requests: [] };
  }
  const data = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(data || '{"items":[], "stock_transactions":[], "receivings":[], "requests":[]}');
}

export const forecastRepository = {
  getTransactionsByItem: (itemId: string) => {
    const db = getDb();
    return (db.stock_transactions || []).filter((t: any) => t.itemId === itemId);
  },
  
  getAllTransactions: () => {
    const db = getDb();
    return db.stock_transactions || [];
  },
  
  getItems: () => {
    const db = getDb();
    return db.items || [];
  }
};
