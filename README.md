# Travel Diary & Discovery 🌍

A premium, editorial-magazine style travel journal web application allowing users to log past adventures, store rich visual memories, rate destinations with custom tags, receive AI-driven travel suggestions, and plan future trips.

> [!NOTE]
> **Redesign Update:** The frontend has been completely redesigned following the **Agence Foudre** visual identity. The application has transitioned from a dark glassmorphism layout to a bold, architectural, typographic design system featuring high-contrast cream canvases (`#fff8f6`), deep forest green text (`#00522d`), lipstick magenta (`#db3c8a`) accents, and responsive GSAP-powered scroll animations.

---

## Key Visual & Animation Features

- **Agence Foudre Editorial Identity:** Clean, premium aesthetic replacing traditional navigation with minimal, fixed circular hotspots (50px pink dots) that trigger full-screen forest green interactive menus.
- **GSAP-powered Animations:** Includes a structured loading preloader, scroll-pinned headers, multi-layered parallax travel photo stacks, staggered feature reveals, and smooth collapsible accordion FAQ panels.
- **Architectural Typography:** Uses high-weight condensed display typography (Antonio) set to tight `0.70` line-heights alongside clean, functional geometric grotesk body text (Inter).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 (Vite), Zustand, GSAP + ScrollTrigger, Mapbox GL JS |
| **Backend** | Node.js + Express (Modular Monolith) |
| **Database** | PostgreSQL 16 (Full-text search, tsvector indexes) |
| **Cache** | Redis 7 |
| **Media** | S3-compatible (Minio in development, AWS S3 in production) |
| **Auth** | JWT Access & opaque refresh tokens stored via secure `HttpOnly` cookies |

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Docker + Docker Compose

### 1. Clone & install dependencies
```bash
git clone <repo-url> travel-diary
cd travel-diary
npm run install:all
```

### 2. Start infrastructure
```bash
docker-compose up -d
```
This boots PostgreSQL on `:5432`, Redis on `:6379`, and Minio on `:9000` (console: `:9001`).

### 3. Configure environment
Create `.env` configurations:
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your secrets, database, S3, and redis configurations.

# Client
cp client/.env.example client/.env
# Add your Mapbox public token to VITE_MAPBOX_TOKEN
```

### 4. Initialize database
Ensure PostgreSQL is running, then seed initial destinations and tags:
```bash
cd server
psql -U travel_user -d travel_diary -f migrations/schema.sql
npm run seed
```

### 5. Run the application locally
Run the development servers:
```bash
# Terminal 1 — Backend API
cd server && npm run dev

# Terminal 2 — Frontend client
cd client && npm run dev
```

- **Frontend client**: http://localhost:5173
- **Backend API Server**: http://localhost:5000
- **Minio Web Console**: http://localhost:9001 (default: `minio_admin` / `minio_password`)

---

## Project Structure

```
travel-diary/
├── client/          # React SPA (Vite, GSAP)
│   └── src/
│       ├── api/     # Axios client wrappers
│       ├── components/  # Page layouts and shared UI
│       ├── hooks/   # React utility hooks
│       ├── pages/   # Reconstructed editorial route components
│       ├── store/   # Global Zustand stores
│       └── styles/  # Agence Foudre CSS design token system
│
├── server/          # Node.js + Express API
│   └── src/
│       ├── config/  # Service configurations
│       ├── middleware/ # Auth validation, error handlers
│       ├── modules/ # Business domains
│       └── seeds/   # Tag & destination seed scripts
│
├── .planning/       # Session handoff records & blueprints
├── docker-compose.yml
└── README.md
```

---

## API Reference

All backend requests are prefixed with `/api`.

| Resource | Endpoints |
|----------|-----------|
| **Auth** | `/api/auth` |
| **Trips** | `/api/trips` |
| **Media** | `/api/trips/:id/media`, `/api/media/:id` |
| **Destinations** | `/api/destinations` |
| **Ratings** | `/api/destinations/:id/ratings`, `/api/ratings/:id` |
| **Planning** | `/api/planned-trips` |

---

## Development Roadmap

- **Phase 1 (MVP)**: Auth, Trips CRUD, Media uploads, Ratings, Search, Planning — ✅ Complete
- **Phase 2 (Design & Core App)**: agencefoudre.com Editorial System, GSAP scroll triggers — 🔄 In Progress
- **Phase 3**: AI Recommendations & Social feed integration — 🔄 In Progress
- **Phase 4**: Collaborative planning & PWA deployment — 📋 Planned

---

## License
MIT
