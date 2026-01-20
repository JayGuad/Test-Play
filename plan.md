# Vendor Portal Plan

## Overview

A web-based demo portal that allows vendors to securely access their account information, view payment history, and manage virtual cards.

**Note:** This is a demo environment that does not use a traditional backend database. Data is stored in simple comma-delimited text files for easy setup and demonstration purposes.

---

## Data Storage

### LoginCredentials.db

A comma-delimited text file storing vendor login credentials.

**Format:**
```
vendor_id,email,password,vendor_name
```

**Example:**
```
1,vendor1@example.com,password123,Acme Supplies
2,vendor2@example.com,password456,Global Parts Inc
```

---

### Payments.db

A comma-delimited text file storing payment header information. One row per payment.

**Format:**
```
payment_id,vendor_id,payment_date,total_amount,currency,payment_method,status,card_number,card_expiration,card_cvv,remittance_email
```

**Fields:**
| Field | Description |
|-------|-------------|
| payment_id | Unique payment identifier |
| vendor_id | Links to vendor in LoginCredentials.db |
| payment_date | Date payment was issued (YYYY-MM-DD) |
| total_amount | Total payment amount (sum of all invoices) |
| currency | Currency code (e.g., USD) |
| payment_method | ACH, Wire, Virtual Card, or Check |
| status | pending, processing, completed, or failed |
| card_number | 16-digit virtual card number (blank if not card payment) |
| card_expiration | Card expiration MM/YY (blank if not card payment) |
| card_cvv | 3-digit CVV (blank if not card payment) |
| remittance_email | Email where remittance advice was sent |

---

### Invoices.db

A comma-delimited text file storing invoice information. Multiple invoices can link to one payment.

**Format:**
```
invoice_id,payment_id,vendor_id,invoice_number,invoice_date,invoice_amount,po_number,description
```

**Fields:**
| Field | Description |
|-------|-------------|
| invoice_id | Unique invoice identifier |
| payment_id | Links to Payments.db |
| vendor_id | Links to vendor in LoginCredentials.db |
| invoice_number | Vendor's invoice number |
| invoice_date | Date on the invoice (YYYY-MM-DD) |
| invoice_amount | Total amount of this invoice |
| po_number | Purchase order number |
| description | Invoice description |

---

### LineItems.db

A comma-delimited text file storing line item details. Multiple line items can link to one invoice.

**Format:**
```
line_item_id,invoice_id,description,quantity,unit_price,line_total,gl_code
```

**Fields:**
| Field | Description |
|-------|-------------|
| line_item_id | Unique line item identifier |
| invoice_id | Links to Invoices.db |
| description | Line item description |
| quantity | Quantity |
| unit_price | Price per unit |
| line_total | Total for this line (quantity × unit_price) |
| gl_code | General ledger / account code |

---

## Data Relationships

```
LoginCredentials.db
        │
        │ vendor_id
        ▼
Payments.db (1) ────────< Invoices.db (many)
                                │
                                │ invoice_id
                                ▼
                        LineItems.db (many)
```

- One vendor can have multiple payments
- One payment can include multiple invoices (batch payment)
- One invoice can have multiple line items

---

## Features

### 1. Login

**Description:** Authentication system for vendors to access the portal.

**Requirements:**
- Email and password-based authentication
- Credentials validated against `LoginCredentials.db`
- Session management (browser session or simple token)
- Basic error messaging for invalid credentials

**User Flow:**
1. Vendor navigates to login page
2. Enters email and password
3. System validates against LoginCredentials.db
4. Redirected to dashboard on success

---

### 2. View Payment History

**Description:** Allow vendors to view their payment history with full invoice and line item details.

**Requirements:**
- List view of all payments for the logged-in vendor
- Data loaded from `Payments.db` filtered by vendor_id
- Filter by date range and status
- Drill-down to see invoices included in each payment (from Invoices.db)
- Drill-down to see line items for each invoice (from LineItems.db)
- Payment details including:
  - Payment date
  - Total amount
  - Payment method
  - Status (pending, processing, completed, failed)
  - Virtual card details (if applicable)

**User Flow:**
1. Vendor logs in and navigates to Payment History
2. System reads Payments.db and filters by vendor_id
3. Vendor views list of their payments
4. Clicks on a payment to view invoices included
5. Clicks on an invoice to view line item details

---

### 3. View Virtual Cards

**Description:** Enable vendors to view their assigned virtual cards used for payments.

**Requirements:**
- List of virtual cards from payments made via Virtual Card method
- Card details including:
  - Card number (masked, with reveal option)
  - Expiration date
  - CVV (hidden, with reveal option)
  - Associated payment information
  - Card status

**User Flow:**
1. Vendor logs in and navigates to Virtual Cards
2. Views list of virtual cards from their payments
3. Clicks on a card to view details
4. Can reveal full card number and CVV

---

## Technical Considerations

### Demo Environment Architecture
- **Frontend:** Simple HTML/CSS/JavaScript or lightweight framework
- **Backend:** Minimal server (Node.js/Python) to read CSV files
- **Data Storage:** Comma-delimited text files (.db extension)
  - `LoginCredentials.db` - User authentication data
  - `Payments.db` - Payment header records
  - `Invoices.db` - Invoice records linked to payments
  - `LineItems.db` - Line item details linked to invoices

### Security Notes (Demo Limitations)
- Passwords stored in plain text (demo only - not for production)
- Virtual card numbers stored in plain text (demo only)
- No encryption on data files
- Basic session handling
- **Warning:** This architecture is for demonstration purposes only and should not be used in production

### File Operations
- Read LoginCredentials.db on login attempt
- Read Payments.db and filter by vendor_id for payment history
- Read Invoices.db and filter by payment_id for invoice details
- Read LineItems.db and filter by invoice_id for line item details
- Files can be manually edited to add/modify demo data

---

## Future Enhancements (If Moving to Production)
- Migrate to proper database (PostgreSQL, MySQL)
- Implement password hashing
- Encrypt sensitive data (card numbers, CVV)
- Add HTTPS and proper security measures
- User management interface
- Audit logging
