# T-Shirt Central 365

Print-on-demand marketplace connecting sellers to print providers.

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript + TailwindCSS
- **Backend:** FastAPI + SQLAlchemy + Alembic
- **Database:** SQLite (local development)
- **Catalog:** Printify API v1/v2 (1,691 blueprints synced)
- **Payments:** Stripe
- **Auth:** JWT + bcrypt
- **Ports:** Frontend: 3005 | Backend: 8000

## Store Integrations

- Shopify, Etsy, WooCommerce, Wix

## Order Flow

Manual fulfillment through Printify after customer payment.

## Getting Started

```bash
# Frontend (port 3005)
cd frontend && npm install && npm run dev

# Backend (port 8000)
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
```
