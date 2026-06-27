# Cargo Ops — Full Platform v2

A complete air cargo operations platform with 27 modules, complaint/claim workflow engine, and 5 AI-powered assistants.

## Modules (all 27)

### Core Operations
| Module | Description |
|--------|-------------|
| **Ops Dashboard** | Real-time stats, SLA breach alerts, priority heatmap, recent cases |
| **Cargo Booking** | Full booking form with chargeable weight calc, AWB generation |
| **Milestone Tracking** | AWB search with full milestone history timeline |
| **Customer Enquiry CRM** | Track and respond to customer enquiries with reply panel |
| **Quotation Manager** | Create, send, and track freight quotations |

### Logistics
| Module | Description |
|--------|-------------|
| **Airway Bill Tracker** | Search, view, manage AWBs with status filters |
| **Airport Pickup Scheduler** | Schedule pickups, assign drivers, view daily calendar |
| **Warehouse Inventory** | Track ULDs, acceptance, uplift readiness |
| **Invoice Tracker** | Invoice CRUD with overdue tracking and reminders |
| **Delivery Proof (ePOD)** | Digital proof of delivery with e-signature |

### Complaints & Claims
| Module | Description |
|--------|-------------|
| **Complaint & Claims Tracker** | Admin table view with SLA countdown, priority, owner |
| **New Complaint** | Submission form with AI auto-triage on submission |
| **Complaint Workflow Engine** | Category-specific workflows: Delay, Damage, Missing Package, Billing, Documentation |

### Management
| Module | Description |
|--------|-------------|
| **Agent Portal** | Agent workbench — bookings, cases, commission summary |
| **Route Rate Manager** | CRUD for route-wise freight rates by commodity |
| **Partner Management** | Airlines, truckers, customs brokers management |
| **Airline Rate Comparison** | Compare rates across airlines for any lane |

### AI Tools (all powered by Claude)
| Module | Description |
|--------|-------------|
| **AI Quotation Assistant** | Natural language freight quotations with rate breakdown |
| **AI Customs/Docs Assistant** | HS codes, IATA DG classification, documentation guidance |
| **Insurance Claim AI** | Step-by-step claim filing guidance with doc requirements |
| **Route Suggestion AI** | Optimal routing options with trade-off analysis |
| **Cargo Description Cleaner** | Standardizes informal descriptions to IATA-compliant format |

### Tools & Analytics
| Module | Description |
|--------|-------------|
| **Chargeable Weight Calculator** | Air/sea volumetric weight with real-time feedback |
| **Shipment Insights Upload** | CSV/Excel upload with AI-generated analytics summary |
| **Reminders & Alerts** | Configure alert rules, view notification log, send manual reminders |

## Setup

### Backend
```bash
cd backend
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, SENDGRID_API_KEY (optional)
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

```env
# Backend (.env)
PORT=4000
CORS_ORIGIN=http://localhost:5173

# AI — Claude (replaces Gemini for all AI features in v2)
ANTHROPIC_API_KEY=sk-ant-...

# Email notifications (optional)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=ops@yourcompany.com
SENDGRID_FROM_NAME=Cargo Ops Desk

# Legacy AI (still supported as fallback)
GEMINI_API_KEY=...
```

## Architecture

- **Frontend**: React + Vite + Tailwind v4 + Framer Motion
- **Backend**: Express + node:sqlite (zero native deps)
- **AI**: Anthropic Claude (server-proxied via `/api/ai/*` routes + direct browser calls for AI tool pages)
- **Notifications**: SendGrid (optional, graceful fallback to logging)
- **SLA Watcher**: Cron job runs every 5 min, escalates breached cases and logs events

## Complaint Lifecycle

```
OPEN → ACKNOWLEDGED → INVESTIGATING → PENDING_CUSTOMER
                   ↘                ↗
                    ESCALATED → RESOLVED → CLOSED
                             ↘ REJECTED
```

Each transition is validated server-side. Forbidden transitions return HTTP 409.

## AI Triage (Step 4)

On complaint creation, AI triage runs automatically:
1. Calls `ANTHROPIC_API_KEY` → Claude Sonnet 4.6
2. Returns `{ summary, recommendation, sentiment }`
3. Stored on complaint record (`ai_summary`, `ai_recommendation`)
4. Displayed on ticket and in complaint detail panel

Falls back to deterministic rule-based triage if AI is unavailable.
