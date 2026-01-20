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
3,vendor3@example.com,password789,Tech Solutions LLC
```

### Payments.db

A comma-delimited text file storing payment information.

**Format:**
```
payment_id,vendor_id,payment_date,amount,payment_method,invoice_reference,status
```

**Example:**
```
1001,1,2025-12-15,5000.00,ACH,INV-2025-001,completed
1002,1,2025-12-20,3250.75,Virtual Card,INV-2025-002,completed
1003,2,2025-12-18,12000.00,Wire,INV-2025-003,pending
1004,1,2026-01-05,7500.00,ACH,INV-2026-001,completed
```

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

**Description:** Allow vendors to view their payment history from the Payments.db file.

**Requirements:**
- List view of all payments for the logged-in vendor
- Data loaded from `Payments.db` filtered by vendor_id
- Filter by date range and status
- Payment details including:
  - Payment date
  - Amount
  - Payment method
  - Invoice reference
  - Status (pending, completed, failed)

**User Flow:**
1. Vendor logs in and navigates to Payment History
2. System reads Payments.db and filters by vendor_id
3. Vendor views list of their payments
4. Can filter to find specific payments

---

### 3. View Virtual Cards

**Description:** Enable vendors to view their assigned virtual cards.

**Requirements:**
- List of virtual cards assigned to the vendor
- Card details including:
  - Card number (masked, with reveal option)
  - Expiration date
  - Available balance/limit
  - Card status (active, frozen, expired)
- View transaction history per card

**Note:** For the demo, virtual card data can be hardcoded or stored in an additional file (VirtualCards.db) if needed.

**User Flow:**
1. Vendor logs in and navigates to Virtual Cards
2. Views list of assigned virtual cards
3. Clicks on a card to view details
4. Can reveal full card number

---

## Technical Considerations

### Demo Environment Architecture
- **Frontend:** Simple HTML/CSS/JavaScript or lightweight framework
- **Backend:** Minimal server (Node.js/Python) to read CSV files
- **Data Storage:** Comma-delimited text files (.db extension)
  - `LoginCredentials.db` - User authentication data
  - `Payments.db` - Payment transaction records

### Security Notes (Demo Limitations)
- Passwords stored in plain text (demo only - not for production)
- No encryption on data files
- Basic session handling
- **Warning:** This architecture is for demonstration purposes only and should not be used in production

### File Operations
- Read LoginCredentials.db on login attempt
- Read Payments.db and filter by vendor_id for payment history
- Files can be manually edited to add/modify demo data

---

## Future Enhancements (If Moving to Production)
- Migrate to proper database (PostgreSQL, MySQL)
- Implement password hashing
- Add HTTPS and proper security measures
- User management interface
- Audit logging
