const form = document.getElementById("payment-form");
const statusWrap = document.getElementById("status");
const statusPill = statusWrap.querySelector(".status-pill");
const statusText = statusWrap.querySelector(".status-text");
const payBtn = document.getElementById("pay-btn");
const receiptWrap = document.getElementById("receipt");
const downloadBtn = document.getElementById("download-btn");

let pollInterval = null;
let activePaymentId = null;

function setStatus(state, text) {
  statusPill.dataset.state = state;
  statusPill.textContent = state.toUpperCase();
  statusText.textContent = text;
}

function setLoading(isLoading) {
  payBtn.disabled = isLoading;
  payBtn.textContent = isLoading ? "Sending payment request..." : "Pay with Airtel Money";
}

async function pollStatus() {
  if (!activePaymentId) return;

  const res = await fetch(`/api/payments/${activePaymentId}/status`);
  const data = await res.json();

  if (!res.ok) {
    setStatus("failed", data.error || "Unable to fetch status.");
    stopPolling();
    return;
  }

  if (data.status === "pending") {
    setStatus("pending", "Waiting for approval on your phone...");
  } else if (data.status === "successful") {
    setStatus("successful", "Payment confirmed. Receipt ready.");
    showReceipt();
    stopPolling();
  } else if (data.status === "failed") {
    setStatus("failed", "Payment failed or was cancelled.");
    stopPolling();
  }
}

function startPolling() {
  stopPolling();
  pollInterval = setInterval(pollStatus, 3000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

function showReceipt() {
  receiptWrap.classList.remove("hidden");
  downloadBtn.onclick = () => {
    if (activePaymentId) {
      window.location.href = `/api/payments/${activePaymentId}/receipt`;
    }
  };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  receiptWrap.classList.add("hidden");

  const formData = new FormData(form);
  const payload = {
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    amount: formData.get("amount"),
    note: formData.get("note")
  };

  setLoading(true);
  setStatus("pending", "Initiating payment request...");

  try {
    const res = await fetch("/api/payments/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus("failed", (data.errors || [data.error || "Payment failed."]).join(" "));
      setLoading(false);
      return;
    }

    activePaymentId = data.id;
    setStatus("pending", "Request sent. Approve the Airtel Money prompt on your phone.");
    startPolling();
  } catch (err) {
    setStatus("failed", "Network error. Please try again.");
  } finally {
    setLoading(false);
  }
});
