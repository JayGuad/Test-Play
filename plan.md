# Vendor Portal Plan

## Overview

A web-based demo portal that allows vendors to securely access their account information, view payment history, and manage virtual cards.

**Note:** This is a demo environment that does not use a traditional backend database. Data is stored in simple comma-delimited text files for easy setup and demonstration purposes.

---

## Branding

This portal will use **Corpay** branding throughout the application.

### Brand Assets
- **Logo:** Corpay logo sourced from [Corpay.com](https://www.corpay.com)
- **Color Scheme:** Colors extracted from Corpay.com brand guidelines

### Brand Colors (from Corpay.com)
| Color | Hex Code | Usage |
|-------|----------|-------|
| Corpay Blue (Primary) | #0066CC | Primary buttons, links, headers |
| Corpay Dark Blue | #003366 | Navigation, footer, accents |
| White | #FFFFFF | Backgrounds, text on dark |
| Light Gray | #F5F5F5 | Secondary backgrounds, cards |
| Dark Gray | #333333 | Body text |
| Success Green | #28A745 | Completed status, success messages |
| Warning Orange | #FFC107 | Pending status, warnings |
| Error Red | #DC3545 | Failed status, error messages |

### Brand Application
- Login page features Corpay logo prominently
- Navigation header includes Corpay logo
- All primary action buttons use Corpay Blue
- Consistent typography and spacing following modern design standards
- Professional, clean aesthetic aligned with financial services industry

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

### 4. Export Payment Data for ERP Cash Application

**Description:** Enable vendors to download payment and remittance data in formats compatible with their ERP system for automated cash application and reconciliation.

**Background:** Cash application is the process of matching incoming payments to open invoices in an ERP system. Different ERP systems accept different file formats, so vendors need flexibility to export data in a format their system can import.

#### Supported Standard ERP Formats

| Format | Description | Common ERP Systems |
|--------|-------------|-------------------|
| **BAI2** | Bank Administration Institute Version 2 - US banking standard for cash management | SAP, Oracle, Microsoft Dynamics, NetSuite, JD Edwards |
| **MT940** | SWIFT standard for bank statement reporting (international) | SAP, Oracle E-Business Suite, Sage, European ERPs |
| **camt.053** | ISO 20022 XML format - modern international standard replacing MT940 | SAP S/4HANA, Oracle Cloud, modern ERP systems |
| **OFX** | Open Financial Exchange - XML-based format | QuickBooks, Quicken, Sage 50 |
| **QBO** | QuickBooks Online format | QuickBooks Online, QuickBooks Desktop |
| **CSV (Standard)** | Pre-mapped CSV with common cash application fields | Universal - all ERPs with import capability |
| **Excel (.xlsx)** | Formatted spreadsheet with headers | Universal - manual import or macro-based |

#### Standard Export Fields

| Field | Description | Included In |
|-------|-------------|-------------|
| Payment ID | Unique payment identifier | All formats |
| Payment Date | Date payment was issued | All formats |
| Payment Amount | Total payment amount | All formats |
| Currency | Currency code (USD, EUR, etc.) | All formats |
| Payment Method | ACH, Wire, Virtual Card, Check | All formats |
| Payment Reference | Bank or transaction reference | BAI2, MT940, camt.053 |
| Invoice Number | Vendor's invoice number | All formats |
| Invoice Amount | Amount applied to this invoice | All formats |
| Invoice Date | Original invoice date | CSV, Excel, OFX |
| PO Number | Purchase order reference | CSV, Excel |
| Remittance Email | Email where remittance was sent | CSV, Excel |
| Line Item Details | Individual line items (optional) | CSV, Excel |
| GL Code | General ledger account codes | CSV, Excel |

#### Custom Export Builder

For vendors whose ERP requires a specific format not covered by standard templates:

**Delimiter Options:**
- Comma (,) - CSV standard
- Tab (\t) - Tab-delimited
- Pipe (|) - Pipe-delimited
- Semicolon (;) - Common in European systems
- Custom delimiter

**Field Selection:**
- Drag-and-drop field ordering
- Select/deselect individual fields
- Rename column headers to match ERP requirements
- Add static/constant value columns

**Format Options:**
- Date format (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, etc.)
- Number format (decimal separator, thousands separator)
- Text qualifier (quotes, none)
- Include/exclude header row
- Character encoding (UTF-8, ASCII, ISO-8859-1)

**Template Management:**
- Save custom export configurations as templates
- Name and describe templates for future use
- Set a default template
- Share templates (future enhancement)

#### Requirements

- Date range filter (from/to dates)
- Payment status filter (completed, pending, all)
- Payment method filter
- Single payment or batch export
- Include invoice detail level or payment summary only
- Option to include or exclude line items
- Preview before download
- Download history log

#### User Flow

1. Vendor navigates to "Export Data" or clicks "Export" from Payment History
2. Selects date range and filters for payments to include
3. Chooses export format:
   - **Quick Export:** Select from dropdown of standard formats (BAI2, MT940, CSV, etc.)
   - **Custom Export:** Opens the custom export builder
4. For custom export:
   a. Select delimiter type
   b. Choose fields to include (drag to reorder)
   c. Configure date/number formats
   d. Preview sample output
   e. Optionally save as template
5. Click "Download" to generate and download file
6. File is generated and downloaded to vendor's computer

#### Example Output Formats

**BAI2 Format Example:**
```
01,CORPAY,VENDOR001,210115,1200,001,80,1,2/
02,VENDOR001,USD,010,150000,,,/
03,001234,USD,010,150000,1,210115,1200,/
16,195,50000,S,INV-2025-001,Payment for services/
16,195,100000,S,INV-2025-002,Payment for services/
49,150000,2/
98,150000,1,4/
99,150000,1,5/
```

**CSV Standard Export Example:**
```
Payment ID,Payment Date,Amount,Currency,Method,Invoice Number,Invoice Amount,PO Number
1001,2025-12-15,8250.75,USD,Virtual Card,INV-2025-001,5000.00,PO-78432
1001,2025-12-15,8250.75,USD,Virtual Card,INV-2025-002,3250.75,PO-78455
1002,2026-01-10,3500.00,USD,ACH,INV-2026-001,3500.00,PO-79001
```

**Custom Pipe-Delimited Example:**
```
PAYMENT_REF|PAY_DATE|INVOICE|AMOUNT|GL_ACCOUNT
1001|12/15/2025|INV-2025-001|5000.00|6200-100
1001|12/15/2025|INV-2025-002|3250.75|6200-105
1002|01/10/2026|INV-2026-001|3500.00|6200-100
```

---

## Technical Considerations

### Demo Environment Architecture
- **Frontend:** React (Create React App or Vite)
  - React Router for navigation
  - Context API or useState for state management
  - CSS Modules or Styled Components for styling
  - Corpay brand colors and styling applied globally
- **Backend:** Node.js/Express server to read CSV files and serve API endpoints
- **Data Storage:** Comma-delimited text files (.db extension)
  - `LoginCredentials.db` - User authentication data
  - `Payments.db` - Payment header records
  - `Invoices.db` - Invoice records linked to payments
  - `LineItems.db` - Line item details linked to invoices

### React Application Structure
```
src/
├── components/
│   ├── Login/
│   ├── Dashboard/
│   ├── PaymentHistory/
│   ├── PaymentDetail/
│   ├── VirtualCards/
│   └── common/
│       ├── Header/
│       ├── Footer/
│       ├── Button/
│       └── Card/
├── context/
│   └── AuthContext.js
├── services/
│   └── api.js
├── styles/
│   └── corpayTheme.css
├── App.js
└── index.js
```

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
