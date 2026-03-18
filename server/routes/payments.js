const express = require("express");
const { ensureReceipt } = require("../services/receiptService");

const router = express.Router();

function validatePaymentInput(body) {
  const errors = [];
  const name = (body.fullName || "").trim();
  const phone = (body.phone || "").trim();
  const amount = Number(body.amount);
  const note = (body.note || "").trim();

  if (!name) errors.push("Full name is required.");
  if (!phone || !/^\+?\d{9,15}$/.test(phone)) errors.push("Phone number is invalid.");
  if (!Number.isFinite(amount) || amount <= 0) errors.push("Amount must be greater than zero.");

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name,
      phone,
      amount: Math.round(amount * 100) / 100,
      note
    }
  };
}

router.post("/initiate", async (req, res, next) => {
  try {
    const { isValid, errors, data } = validatePaymentInput(req.body);
    if (!isValid) {
      return res.status(400).json({ errors });
    }

    const db = req.app.locals.db;
    const provider = req.app.locals.paymentProvider;
    const now = new Date().toISOString();

    const result = await db.run(
      "INSERT INTO payments (client_name, phone, amount, note, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      data.name,
      data.phone,
      data.amount,
      data.note,
      "initiated",
      now,
      now
    );

    const paymentId = result.lastID;
    const providerResponse = await provider.initiatePayment({
      paymentId,
      amount: data.amount,
      phone: data.phone,
      name: data.name,
      note: data.note
    });

    await db.run(
      "UPDATE payments SET status = ?, provider_ref = ?, updated_at = ? WHERE id = ?",
      providerResponse.status,
      providerResponse.providerRef,
      new Date().toISOString(),
      paymentId
    );

    if (provider.scheduleOutcome) {
      provider.scheduleOutcome(paymentId);
    }

    return res.json({
      id: paymentId,
      status: providerResponse.status
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/status", async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const paymentId = Number(req.params.id);

    if (!Number.isInteger(paymentId)) {
      return res.status(400).json({ error: "Invalid payment id." });
    }

    const payment = await db.get("SELECT * FROM payments WHERE id = ?", paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    if (payment.status === "successful") {
      await ensureReceipt({ db, paymentId });
    }

    const receipt = await db.get("SELECT * FROM receipts WHERE payment_id = ?", paymentId);

    return res.json({
      id: payment.id,
      status: payment.status,
      receiptAvailable: Boolean(receipt),
      receiptId: receipt ? receipt.id : null
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/receipt", async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const paymentId = Number(req.params.id);

    if (!Number.isInteger(paymentId)) {
      return res.status(400).json({ error: "Invalid payment id." });
    }

    const payment = await db.get("SELECT * FROM payments WHERE id = ?", paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    if (payment.status !== "successful") {
      return res.status(409).json({ error: "Receipt available after successful payment." });
    }

    const receipt = await ensureReceipt({ db, paymentId });
    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found." });
    }

    return res.download(receipt.file_path);
  } catch (err) {
    next(err);
  }
});

router.post("/webhook", async (req, res) => {
  // Placeholder for future Airtel Money callbacks.
  return res.json({ ok: true });
});

module.exports = router;
