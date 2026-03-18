const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const { getDb } = require("./db");
const paymentsRouter = require("./routes/payments");
const { MockPaymentProvider } = require("./services/paymentProvider");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

async function start() {
  const db = await getDb();
  const paymentProvider = new MockPaymentProvider({ db });

  app.locals.db = db;
  app.locals.paymentProvider = paymentProvider;

  app.use("/api/payments", paymentsRouter);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
