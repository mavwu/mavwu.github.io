const crypto = require("crypto");

function randomRef(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
}

class MockPaymentProvider {
  constructor({ db }) {
    this.db = db;
  }

  async initiatePayment({ paymentId }) {
    const providerRef = randomRef("MOCK");
    return {
      providerRef,
      status: "pending"
    };
  }

  async scheduleOutcome(paymentId) {
    const delayMs = 5000 + Math.floor(Math.random() * 4000);
    setTimeout(async () => {
      const outcome = Math.random() < 0.85 ? "successful" : "failed";
      const now = new Date().toISOString();

      try {
        await this.db.run(
          "UPDATE payments SET status = ?, updated_at = ? WHERE id = ?",
          outcome,
          now,
          paymentId
        );
      } catch (err) {
        // Avoid crashing the process if the mock update fails.
        console.error("Mock provider update failed:", err.message);
      }
    }, delayMs);
  }

  async getStatus({ paymentId }) {
    const row = await this.db.get("SELECT status FROM payments WHERE id = ?", paymentId);
    return row ? row.status : "failed";
  }
}

module.exports = {
  MockPaymentProvider
};
