# Client Payment Portal

A simple payment portal that initiates an Airtel Money request-to-pay flow (mocked for now). It includes a modern frontend, Node.js/Express backend, SQLite storage, and PDF receipt generation.

## Features
- Payment form UI with status updates
- Mock payment provider that simulates pending -> success/failure
- SQLite database with auto schema creation
- PDF receipt generation
- Easy provider swap via a single service file

## Project Structure
- `public/` frontend UI
- `server/` backend API + services + SQLite DB
- `.env.example` sample environment variables

## Setup
1. Install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Create your environment file:
   - Copy `.env.example` to `.env` in the project root.
3. Start the server:
   ```bash
   npm start
   ```
4. Open the portal:
   - Visit `http://localhost:3000`

## API Routes
- `POST /api/payments/initiate`
- `GET /api/payments/:id/status`
- `GET /api/payments/:id/receipt`
- `POST /api/payments/webhook` (placeholder for provider callbacks)

## Where to Plug In Airtel Money Logic
Open `server/services/paymentProvider.js` and replace the `MockPaymentProvider` implementation with real Airtel Money API calls:
- `initiatePayment()` should call Airtel request-to-pay and return the provider reference.
- `getStatus()` should query the provider status if needed.
- `scheduleOutcome()` can be removed when real callbacks or polling are used.

The rest of the app reads provider status from the database, so swapping providers is isolated to the service layer.

## Notes
- The database file is stored at `server/payments.db`.
- Receipts are stored in `server/receipts/`.
- No secrets are exposed in frontend code; use `.env` for credentials.
