const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const crypto = require("crypto");

function makeReceiptNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `RCP-${y}${m}${d}-${rand}`;
}

async function generateReceipt({ db, payment }) {
  const receiptsDir = path.join(__dirname, "..", "receipts");
  const receiptNumber = makeReceiptNumber();
  const filename = `${receiptNumber}.pdf`;
  const filePath = path.join(receiptsDir, filename);

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).text("Payment Receipt", { align: "center" });
  doc.moveDown(1);
  doc.fontSize(12).text(`Receipt Number: ${receiptNumber}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  doc.moveDown(1);

  doc.fontSize(12).text(`Client Name: ${payment.client_name}`);
  doc.text(`Phone Number: ${payment.phone}`);
  doc.text(`Amount: ZMW ${Number(payment.amount).toFixed(2)}`);
  doc.text(`Service/Note: ${payment.note || "-"}`);
  doc.text("Payment Method: Airtel Money");
  doc.text(`Transaction ID: ${payment.provider_ref || "-"}`);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  const now = new Date().toISOString();
  const result = await db.run(
    "INSERT INTO receipts (payment_id, receipt_number, file_path, created_at) VALUES (?, ?, ?, ?)",
    payment.id,
    receiptNumber,
    filePath,
    now
  );

  return {
    id: result.lastID,
    receiptNumber,
    filePath
  };
}

async function ensureReceipt({ db, paymentId }) {
  const existing = await db.get("SELECT * FROM receipts WHERE payment_id = ?", paymentId);
  if (existing) {
    return existing;
  }

  const payment = await db.get("SELECT * FROM payments WHERE id = ?", paymentId);
  if (!payment || payment.status !== "successful") {
    return null;
  }

  return generateReceipt({ db, payment });
}

module.exports = {
  generateReceipt,
  ensureReceipt
};
