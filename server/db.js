const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const DB_PATH = path.join(__dirname, "payments.db");

async function initSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      status TEXT NOT NULL,
      provider_ref TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL,
      receipt_number TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(payment_id) REFERENCES payments(id)
    );
  `);
}

async function getDb() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await initSchema(db);

  // Ensure receipts directory exists.
  const receiptsDir = path.join(__dirname, "receipts");
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }

  return db;
}

module.exports = {
  getDb
};
