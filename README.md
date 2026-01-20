# Corpay Vendor Portal Demo

A demo vendor portal built with React and Node.js, featuring Corpay branding.

![Corpay Logo](https://corpay.com)

## Features

- **Login** - Secure authentication for vendors
- **Dashboard** - Overview of payments, invoices, and virtual cards
- **Payment History** - View all payments with filtering, drill down to invoices and line items
- **Virtual Cards** - View and manage virtual card details

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone or download this repository

2. Install all dependencies:
   ```bash
   npm run install:all
   ```
   
   Or install each separately:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

### Running the Application

**Option 1: Run both server and client together (recommended)**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 - Start the backend server:
```bash
cd server
npm run dev
```

Terminal 2 - Start the React frontend:
```bash
cd client
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

## Demo Credentials

| Vendor | Email | Password |
|--------|-------|----------|
| ACME Landscaping | James@ACMELandscaping.com | Landscape2026! |
| ABC Construction | Tim@ABCconstruction.com | BuildIt99# |
| Generic University | John@GenericUniversity.com | Campus456$ |

## Project Structure

```
corpay-vendor-portal/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Auth context
│   │   └── styles/         # CSS styles
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Express server
│   └── package.json
├── LoginCredentials.db    # Vendor login data (CSV)
├── Payments.db            # Payment records (CSV)
├── Invoices.db            # Invoice records (CSV)
├── LineItems.db           # Line item details (CSV)
├── plan.md                # Project planning document
└── package.json           # Root package.json
```

## Data Files

The demo uses comma-delimited text files as a simple database:

- **LoginCredentials.db** - Vendor authentication
- **Payments.db** - Payment header records with virtual card details
- **Invoices.db** - Invoices linked to payments
- **LineItems.db** - Line items for each invoice

You can edit these files to add/modify demo data.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login` | POST | Authenticate vendor |
| `/api/payments/:vendorId` | GET | Get payments for vendor |
| `/api/invoices/:paymentId` | GET | Get invoices for payment |
| `/api/lineitems/:invoiceId` | GET | Get line items for invoice |
| `/api/virtualcards/:vendorId` | GET | Get virtual cards for vendor |
| `/api/dashboard/:vendorId` | GET | Get dashboard summary |

## Tech Stack

- **Frontend:** React 18, React Router, Vite
- **Backend:** Node.js, Express
- **Styling:** Custom CSS with Corpay branding

## Notes

⚠️ **This is a demo application** - Not for production use. Passwords and card numbers are stored in plain text for demonstration purposes.
