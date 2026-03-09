# SecurePulse — Security Scanning Platform

Enterprise security scanning for GitHub repos and Docker images. Built with **Next.js 14+**, **Stack Auth**, **Prisma**, **Neon Postgres**, **Tailwind CSS**, and **shadcn/ui**.

## Features

- **OAuth Authentication** — Google & GitHub via Stack Auth SDK (zero custom OAuth code)
- **GitHub Repository Discovery** — Connect via PAT, auto-discover repos
- **Security Scanning** — TruffleHog, Semgrep, Trivy, VirusTotal, npm audit
- **Alert Management** — Severity-based alerts with acknowledge/resolve workflow
- **Dashboard** — Real-time stats, alert breakdown, recent scan history
- **Admin Panel** — User management, audit logs, system metrics
- **RBAC** — Admin, Manager, Developer roles
- **Audit Logging** — Automatic mutation tracking

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/t4tarzan/securepulse-next.git
cd securepulse-next
npm install
```

### 2. Set up environment
```bash
cp .env.example .env.local
# Fill in your Neon DB URL, Stack Auth keys
```

### 3. Set up database
```bash
npm run db:push    # Push schema to Neon
npm run db:seed    # Seed demo data
```

### 4. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Stack Auth Setup

1. Create project at [app.stack-auth.com](https://app.stack-auth.com)
2. Enable Google and/or GitHub OAuth providers
3. Add your domain to **Trusted Domains** (e.g. `localhost` for dev, `your-app.vercel.app` for prod)
4. Copy Project ID, Publishable Key, and Secret Key to `.env.local`

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push to GitHub
2. Import repo in Vercel
3. Add env vars from `.env.example`
4. Deploy — Vercel auto-detects Next.js

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Auth | Stack Auth SDK |
| Database | Neon Postgres + Prisma |
| UI | Tailwind CSS + shadcn/ui |
| Icons | Lucide React |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── (authenticated)/    # Protected pages (dashboard, repos, scans, alerts, admin)
│   ├── api/                # API routes
│   ├── signin/             # Sign-in page
│   ├── stack-handler/      # Stack Auth handler
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Redirect to /dashboard
├── components/             # Reusable components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth.ts             # Auth helpers (getCurrentUser, requireAuth)
│   ├── db.ts               # Prisma client singleton
│   └── utils.ts            # Utility functions
└── stack.ts                # Stack Auth server app config
```

## License

MIT
