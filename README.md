# AutoParts POS — Retail POS System

A full-featured Point of Sale system built for a small auto accessories shop.

## Tech Stack

- **Next.js 16** (App Router) with TypeScript
- **shadcn/ui** + Tailwind CSS for the UI
- **MongoDB** with Mongoose ODM
- **NextAuth.js** v4 for authentication (Credentials provider)
- **Recharts** for sales/profit charts
- **react-to-print** for invoice printing

## Features

- **Login / Auth** — JWT-based sessions via NextAuth, two roles: `admin` and `employee`
- **Point of Sale** — Real-time product search, cart management, discount support, cash/online payment
- **Bill Generation** — Auto-generated sequential invoice (INV-0001, INV-0002...), printable A4 invoice
- **Stock Management** — Automatic atomic stock deduction on every sale
- **Inventory** (admin only) — Full product CRUD: add, edit, delete; low stock indicators (≤5 units highlighted)
- **Reports** (admin only) — Daily/Monthly/Yearly sales and profit bar charts, line trend chart, summary stats
- **Bills History** — Paginated table of all invoices with search

## Getting Started

### 1. Prerequisites

- Node.js v18+
- MongoDB running locally or MongoDB Atlas connection string

### 2. Environment Variables

Create `.env.local` (already created, update values as needed):

```env
MONGODB_URI=mongodb://localhost:27017/retail-lite-pos
NEXTAUTH_SECRET=your-super-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

### 3. Install Dependencies

```bash
npm install
```

### 4. Seed the Database

This creates 2 users and 15 sample products:

```bash
MONGODB_URI=mongodb://localhost:27017/retail-lite-pos npm run seed
```

**Default credentials:**

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@shop.com         | admin123     |
| Employee | employee@shop.com      | employee123  |

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # All protected pages
│   │   ├── page.tsx           # Dashboard (stats + recent sales)
│   │   ├── pos/               # Point of Sale
│   │   ├── bills/             # Bills list + [id] invoice view
│   │   ├── inventory/         # Product management (admin)
│   │   └── reports/           # Charts (admin)
│   └── api/                   # REST API routes
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # Sidebar, Topbar, Mobile nav
│   └── bills/                 # Invoice template
├── lib/
│   ├── db.ts                  # MongoDB connection
│   ├── auth.ts                # NextAuth config
│   └── utils.ts               # formatCurrency helper
└── models/
    ├── User.ts
    ├── Product.ts
    └── Sale.ts
```

## Role-Based Access

| Feature      | Admin | Employee |
|-------------|-------|----------|
| Dashboard   | ✓     | ✓        |
| POS / Billing | ✓   | ✓        |
| Bills History | ✓   | ✓        |
| Inventory   | ✓     | ✗        |
| Reports     | ✓     | ✗        |

## Profit Calculation

When adding a product, you set:
- **Base price** — purchase/cost price
- **Selling price** — retail price

Per sale, profit = `(sellingPrice - basePrice) × quantity` per item.  
The `totalProfit` is stored on every Sale document and used in reports.

## Production Deployment

1. Set `MONGODB_URI` to your MongoDB Atlas URI
2. Set a strong `NEXTAUTH_SECRET`
3. Run `npm run build && npm start`
