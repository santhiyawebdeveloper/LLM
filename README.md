# Shopify LMS App

## Overview

Shopify LMS is a production-quality embedded Shopify application that enables merchants to manage courses, students, and enrollments directly within Shopify Admin. Built as a multi-tenant SaaS application with secure session-token authentication, MongoDB persistence, and real Shopify Admin GraphQL integration.

## Features

- **Course Management** — Full CRUD with search, status filtering, and pagination
- **Student Management** — Create, list, view details, and per-student dashboards
- **Enrollment Management** — Enroll students, prevent duplicates, track status
- **Analytics Dashboard** — Real-time counts and recent enrollment activity
- **Shopify Integration** — Live shop info and products via Admin GraphQL API
- **Multi-Tenant Security** — Complete data isolation per Shopify store
- **Embedded UI** — Shopify Polaris design system with App Bridge

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, Shopify Polaris, App Bridge, React Router, TanStack Query |
| Backend | Node.js, TypeScript, Express, Shopify official API library, Zod |
| Database | MongoDB, Mongoose |
| Deployment | Render, MongoDB Atlas |

## Architecture

```
client/          React embedded frontend (Vite)
server/          Express API + Shopify auth
  config/        Environment, DB, Shopify setup
  middleware/    Auth, validation, error handling
  models/        Mongoose schemas (Store, Course, Student, Enrollment)
  routes/        REST API routes
  controllers/   Request handlers
  services/      Business logic
  validators/    Zod schemas
```

**Request flow:** Route → Controller → Service → Database/API

**Authentication flow:**
1. Merchant installs app via Shopify Managed Installation
2. App Bridge provides session tokens to the frontend
3. Backend validates session tokens via `@shopify/shopify-app-express`
4. Store context is synced to MongoDB; all LMS queries scoped by `storeId`

## Database Schema

### Store
- `shopDomain` (unique), `shopName`, `shopifyAccessToken` (hidden), `scopes`

### Course
- `storeId`, `title`, `description`, `instructorName`, `category`, `duration`, `status` (ACTIVE/INACTIVE)

### Student
- `storeId`, `name`, `email` — unique compound index: `storeId + email`

### Enrollment
- `storeId`, `studentId`, `courseId`, `enrollmentDate`, `status` (IN_PROGRESS/COMPLETED)
- Unique compound index: `storeId + studentId + courseId`

### Course Deletion

Courses with existing enrollments cannot be deleted. Remove enrollments first, then delete the course. This prevents orphaned enrollment records.

### App Uninstall

When a merchant uninstalls the app, the `app/uninstalled` webhook removes the Store record and all associated courses, students, and enrollments for that shop.

## Authentication Flow

Uses Shopify's current recommended architecture:
- Shopify Managed Installation
- App Bridge CDN session tokens (`window.shopify.idToken()`)
- `@shopify/shopify-app-express` middleware with Bearer token validation
- Token exchange via official Shopify Node library
- Never trusts shop identity from request body/query

## Shopify GraphQL Integration

- `GET /api/shopify/shop` — Shop ID, name, email, myshopifyDomain
- `GET /api/shopify/products` — Product id, title, status

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses` | Create course |
| GET | `/api/courses` | List courses |
| GET | `/api/courses/:id` | Get course |
| PATCH | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| POST | `/api/students` | Create student |
| GET | `/api/students` | List students |
| GET | `/api/students/:id` | Get student with enrollments |
| GET | `/api/students/:id/dashboard` | Student dashboard |
| POST | `/api/enrollments` | Create enrollment |
| GET | `/api/enrollments` | List enrollments |
| GET | `/api/enrollments/:id` | Get enrollment |
| PATCH | `/api/enrollments/:id/status` | Update status |
| DELETE | `/api/enrollments/:id` | Delete enrollment |
| GET | `/api/dashboard/summary` | Dashboard stats |
| GET | `/api/dashboard/recent-enrollments` | Recent enrollments |
| GET | `/api/shopify/shop` | Shopify shop info |
| GET | `/api/shopify/products` | Shopify products |

## Environment Variables

### Server (root `.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SHOPIFY_API_KEY` | Yes | Partner App Client ID |
| `SHOPIFY_API_SECRET` | Yes | Partner App API secret (server only) |
| `SHOPIFY_APP_URL` | Yes | Public HTTPS app URL, no trailing slash |
| `SHOPIFY_SCOPES` | Yes | Default: `read_products` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string (server only) |
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Default: `3000` |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SHOPIFY_API_KEY` | Yes | Same value as `SHOPIFY_API_KEY` (public, embedded in bundle) |

Never put `SHOPIFY_API_SECRET` or `MONGODB_URI` in client env files.

## Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Shopify Partner account and development store
- Shopify CLI (recommended for embedded testing)

### Install Shopify CLI (Windows)

Shopify CLI is not currently installed on this machine. Install it with:

```powershell
npm install -g @shopify/cli @shopify/theme
```

Verify:

```powershell
shopify version
```

Alternative (Homebrew on macOS/Linux):

```bash
brew tap shopify/shopify
brew install shopify-cli
```

Official docs: [Shopify CLI installation](https://shopify.dev/docs/api/shopify-cli)

### MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write access
3. Allow network access (`0.0.0.0/0` for development, or Render IPs for production)
4. Copy the connection string, e.g.:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/shopify-lms?retryWrites=true&w=majority`
5. Set `MONGODB_URI` in root `.env`

### Shopify Partner App Setup

1. Create a Partner account at [partners.shopify.com](https://partners.shopify.com)
2. Create a development store
3. Create a new app → **Create app manually** (or link via CLI)
4. Copy **Client ID** → `SHOPIFY_API_KEY`
5. Copy **Client secret** → `SHOPIFY_API_SECRET`
6. Enable **Embedded app**
7. Set scopes: `read_products`
8. Update `shopify.app.toml` placeholders:
   - `client_id` → your Client ID
   - `dev_store_url` → your dev store domain
   - `application_url` → your tunnel or Render URL (updated automatically by CLI during dev)

### Configure Local Environment

```bash
cp .env.example .env
cp client/.env.example client/.env
# Edit both files with your credentials
# VITE_SHOPIFY_API_KEY must equal SHOPIFY_API_KEY
```

## Running Locally

### Option A — Shopify CLI (recommended for embedded testing)

```bash
npm install
shopify app config link   # link to your Partner app (first time)
shopify app dev           # starts tunnel + dev server
```

Shopify CLI updates app URLs automatically when `automatically_update_urls_on_dev = true` in `shopify.app.toml`.

### Option B — Manual dev servers

```bash
npm install
npm run dev
```

- Server: `http://localhost:3000`
- Vite client: `http://localhost:5173` (proxies `/api` to port 3000)

For embedded testing with Option B, expose port 3000 via a tunnel (e.g. ngrok) and set `SHOPIFY_APP_URL` and Partner Dashboard URLs to the tunnel URL.

## Testing

```bash
npm test
```

Tests cover:
- Course CRUD and validation
- Student creation and duplicate prevention
- Enrollment creation and duplicate prevention (service + DB layer)
- Tenant isolation
- Authentication failure
- Shopify API error handling

## Production Deployment (Render)

### Render Environment Variables

Set these in the Render dashboard (or via `render.yaml`):

| Variable | When | Notes |
|----------|------|-------|
| `NODE_ENV` | Runtime | `production` |
| `SHOPIFY_API_KEY` | Build + Runtime | Partner App Client ID |
| `SHOPIFY_API_SECRET` | Runtime only | Never expose to client |
| `SHOPIFY_APP_URL` | Build + Runtime | `https://your-app.onrender.com` (no trailing slash) |
| `SHOPIFY_SCOPES` | Runtime | `read_products` |
| `MONGODB_URI` | Runtime only | MongoDB Atlas connection string |
| `VITE_SHOPIFY_API_KEY` | **Build time** | Same as `SHOPIFY_API_KEY` |
| `PORT` | Runtime | `3000` (Render sets automatically) |

The client build reads `VITE_SHOPIFY_API_KEY` (or falls back to `SHOPIFY_API_KEY`) to inject the App Bridge meta tag.

### Deploy Steps

1. Push repository to GitHub
2. Create a Render Web Service from `render.yaml` or manually:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
3. Set all environment variables above
4. Deploy and note the Render URL (e.g. `https://shopify-lms-app.onrender.com`)

### Post-Deploy Shopify Configuration

Replace all placeholder URLs with your Render URL:

| Setting | Value |
|---------|-------|
| App URL | `https://YOUR-RENDER-URL.onrender.com` |
| Allowed redirection URL(s) | `https://YOUR-RENDER-URL.onrender.com/api/auth/callback` |
| Webhook `app/uninstalled` | `https://YOUR-RENDER-URL.onrender.com/api/webhooks` |

Update `shopify.app.toml` `application_url` and `redirect_urls` for future CLI deploys.

Install the app on your development store from the Partner Dashboard and verify embedded loading.

### MongoDB Atlas (Production)

1. Use a dedicated Atlas cluster/database for production
2. Whitelist Render outbound IPs or use `0.0.0.0/0` (less restrictive)
3. Use a strong database user password
4. Connection string example:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/shopify-lms?retryWrites=true&w=majority`

## Live Verification Checklist

Use this checklist after configuring credentials. Do not skip steps.

### Credentials Required From You

| Item | Purpose |
|------|---------|
| Shopify Partner account | App management |
| Development store URL | e.g. `your-store.myshopify.com` |
| `SHOPIFY_API_KEY` (Client ID) | App authentication |
| `SHOPIFY_API_SECRET` | Server-side OAuth |
| MongoDB Atlas `MONGODB_URI` | Database |
| Public HTTPS app URL | Tunnel (local) or Render URL (production) |

### User Flow Test (Development Store)

1. **Install app** on development store
2. **Dashboard** — verify counts load from MongoDB
3. **Course** — create "React Advanced LMS" (Technology, 30 hrs, Active)
4. **Course** — list, search, view, edit, filter, delete (delete only after removing enrollments)
5. **Student** — create "Test Student" / `student@example.com`
6. **Enrollment** — enroll student into course
7. **Duplicate enrollment** — retry same enrollment → expect HTTP 409
8. **Status** — change In Progress → Completed
9. **Dashboard** — verify counts update
10. **Student dashboard** — verify enrolled course, dates, statuses
11. **Shopify Store Info** — verify real shop data from GraphQL
12. **Shopify Products** — verify real product list from GraphQL

### Multi-Tenant Test (Optional, Two Dev Stores)

- Store A data must not appear in Store B and vice versa
- Cross-store API access by ID must return 404

## Live Demo

Deploy to Render and configure Shopify app URLs to your production domain.

## Screenshots

Add screenshots after deployment:
- Dashboard overview
- Course management
- Student enrollment flow
- Shopify products integration

## Security Considerations

- Session token authentication on all LMS endpoints
- Tenant isolation via authenticated `storeId`
- Access tokens never exposed in API responses or frontend
- Zod validation on all inputs
- Centralized error handling without stack trace leakage
- CORS restricted in production
- App uninstall webhook cleans up store data

## Future Improvements

- Email notifications for enrollment events
- Course content modules and progress tracking
- Bulk student import via CSV
- Advanced analytics and reporting
- Shopify customer sync for auto-student creation
- Role-based access within merchant teams
