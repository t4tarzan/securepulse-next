# PRD — SecurePulse Next

**Product Requirements Document for the Next.js/Vercel Rebuild**

**Author:** Vinayak  
**Date:** 2026-03-10  
**Version:** 1.0  
**Source of Truth:** SecurePulse v1.4.1 (Docker/Svelte) — feature-complete reference implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State — SecurePulse Next (Vercel)](#2-current-state--securepulse-next-vercel)
3. [Target State — Full Feature Parity + Enhancements](#3-target-state--full-feature-parity--enhancements)
4. [Technology Stack](#4-technology-stack)
5. [Authentication & Demo Login](#5-authentication--demo-login)
6. [Role-Based Access Control (RBAC)](#6-role-based-access-control-rbac)
7. [Navigation & Layout](#7-navigation--layout)
8. [Page-by-Page Feature Specifications](#8-page-by-page-feature-specifications)
   - 8.1 [Sign-In Page](#81-sign-in-page)
   - 8.2 [Dashboard](#82-dashboard)
   - 8.3 [Repositories](#83-repositories)
   - 8.4 [Scans](#84-scans)
   - 8.5 [Alerts](#85-alerts)
   - 8.6 [Scan Queue (Admin)](#86-scan-queue-admin)
   - 8.7 [Admin Panel](#87-admin-panel)
   - 8.8 [Audit Log](#88-audit-log)
   - 8.9 [Settings](#89-settings)
9. [Security Scanners](#9-security-scanners)
10. [Scan Orchestration Engine](#10-scan-orchestration-engine)
11. [API Reference](#11-api-reference)
12. [Database Schema](#12-database-schema)
13. [Real-Time Features](#13-real-time-features)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Gap Analysis — What Needs to Be Built](#15-gap-analysis--what-needs-to-be-built)

---

## 1. Executive Summary

SecurePulse is a proactive security monitoring platform for GitHub repositories and Docker Hub images. It integrates 6 industry-standard scanners to detect secrets, vulnerabilities, malware, and insecure code. The platform supports 4 user roles (Admin, Security Admin, Manager, Developer) with role-based dashboards, real-time alerts, scan orchestration with configurable concurrency, and complete audit trails.

**SecurePulse Next** is the rebuild of this platform using Next.js (App Router), deployed on Vercel with Neon Postgres, designed for serverless-first architecture while maintaining full feature parity with the Docker-based v1.4.1.

### Goals for SecurePulse Next

1. **Full feature parity** with SecurePulse v1.4.1
2. **Modern stack**: Next.js 16+, React 19, shadcn/ui, Tailwind CSS v4
3. **Serverless deployment** on Vercel with Neon Postgres
4. **Stack Auth SDK** (native, not REST API — leverages `@stackframe/stack`)
5. **Better UX** with React Server Components, streaming, and Suspense

---

## 2. Current State — SecurePulse Next (Vercel)

The SecurePulse Next repo (`securepulse-next`) has a **partial implementation**. Here is what currently exists:

### Implemented (Working)

| Feature | Status | Notes |
|---------|--------|-------|
| **Stack Auth SDK integration** | ✅ Done | `@stackframe/stack` v2.8.71, Google + GitHub OAuth, email sign-in |
| **Sign-in page** | ✅ Done | Google OAuth, GitHub OAuth, Email sign-in buttons |
| **Authenticated layout** | ✅ Done | Sidebar + header with SidebarProvider |
| **App sidebar** | ✅ Done | Dashboard, Repos, Scans, Alerts, Admin nav items |
| **Dashboard page** | ✅ Done | 4 stat cards, alert severity breakdown, recent scans |
| **Repositories page** | ✅ Done | GitHub repo cards + Docker images, Connect GitHub (PAT), Refresh, Scan button |
| **Scans page** | ✅ Done | Table with target, type, status, alerts, dates |
| **Alerts page** | ✅ Done | Tabbed (Open/Acknowledged/Resolved), Acknowledge + Resolve buttons with dialog |
| **Admin page** | ✅ Done | System stats, user table with roles, audit log table |
| **GitHub PAT connect** | ✅ Done | Dialog with token input, validates against GitHub API |
| **Repo refresh** | ✅ Done | Fetches all repos via GitHub API with pagination |
| **Scan trigger** | ✅ Done | Dropdown menu: Secret Scan, SAST, Dependency, Full |
| **Built-in scanners** | ✅ Done | Secret scanner (regex), SAST scanner (regex), Dependency scanner (OSV.dev API) |
| **Alert actions** | ✅ Done | Acknowledge button, Resolve dialog with notes |
| **Audit logging** | ✅ Done | Auto-logged on scan completion |
| **Prisma schema** | ✅ Done | User, Role, UserRole, GitHubRepository, DockerImage, RepositoryScan, Alert, AlertAssignment, AlertResolution, OAuthToken, AuditLog |
| **Seed script** | ✅ Done | Creates admin + developer users, sample repos, scans, alerts |
| **shadcn/ui components** | ✅ Done | 18 components: alert, avatar, badge, button, card, dialog, dropdown-menu, input, label, select, separator, sheet, sidebar, skeleton, table, tabs, textarea, tooltip |

### Missing (Needs to be built)

| Feature | Priority | Notes |
|---------|----------|-------|
| **Demo login modal** | HIGH | "Try Demo" button with 3 role cards + one-click login |
| **Security Score widget** | HIGH | Radial SVG chart (0-100) on dashboard |
| **30-day scan trend chart** | HIGH | Bar chart on dashboard |
| **Clickable stat cards** | MEDIUM | Navigate to respective pages on click |
| **Scan filters & stats** | HIGH | Status/type dropdowns, pass rate, avg duration cards |
| **Scan tabs** | HIGH | All / Running / Completed / Failed tabs |
| **Scan queue controls** | HIGH | Pause/Resume/Stop Pending/Clear All buttons |
| **Queue status badges** | HIGH | Active/Waiting/Completed/Failed live counts |
| **Scan retry & delete** | HIGH | Per-row retry/delete, bulk operations |
| **Alert severity ring chart** | MEDIUM | SVG donut chart on alerts page |
| **Alert assignment workflow** | HIGH | Assign to user dropdown |
| **Alert statistics cards** | MEDIUM | Open/Acknowledged/Resolved/Total counts |
| **Scan Queue page** | HIGH | Full admin page: logs, error patterns, failed scans, config |
| **Error correlation** | HIGH | Fingerprint-based error grouping |
| **Scan orchestration config** | HIGH | Concurrency, auto-scan toggle, pause-on-failure settings |
| **Docker Hub connect** | HIGH | Username-based Docker Hub integration |
| **Docker image scanning** | HIGH | Trivy, Gitleaks for container images |
| **VirusTotal scanner** | MEDIUM | Malware detection API integration |
| **Scheduled scans** | HIGH | Daily 2 AM UTC cron for all assets |
| **Auto-queue on connect** | HIGH | Full scan on GitHub/Docker connect |
| **Role management** | HIGH | Admin add/remove roles for users |
| **Customer management** | MEDIUM | Admin CRUD for customers |
| **Full audit log page** | MEDIUM | Filterable, searchable audit log viewer |
| **Settings page** | MEDIUM | Scan config, import/export, integrations tabs |
| **WebSocket / real-time** | MEDIUM | Live scan status updates |
| **Role switching** | MEDIUM | Users can switch between assigned roles |
| **Clear all repos/images** | LOW | Bulk delete buttons |
| **GitHub OAuth connect** | MEDIUM | Alternative to PAT — OAuth App flow |

---

## 3. Target State — Full Feature Parity + Enhancements

The goal is to bring SecurePulse Next to **full feature parity** with SecurePulse v1.4.1 while leveraging Next.js advantages:

- **Server Components** for data-heavy pages (dashboard, admin, audit log)
- **Server Actions** for mutations (scan trigger, alert resolve, role assign)
- **Streaming + Suspense** for progressive loading
- **Edge Runtime** where possible for scan queue status polling
- **Vercel Cron** for scheduled scans (replaces Bull queue cron)
- **Vercel KV or Upstash Redis** for queue state (if needed)

---

## 4. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16+ (App Router) | Full-stack React framework |
| **Language** | TypeScript 5+ | Type safety |
| **Auth** | Stack Auth SDK (`@stackframe/stack`) | OAuth + email/password |
| **Database** | Neon Postgres + Prisma ORM | Serverless PostgreSQL |
| **UI Framework** | Tailwind CSS v4 + shadcn/ui | Styling + components |
| **Icons** | Lucide React | Icon library |
| **State** | React Server Components + `useOptimistic` | Minimal client state |
| **Deployment** | Vercel | Serverless hosting |
| **Cron** | Vercel Cron Jobs | Scheduled scans |
| **Real-time** | Vercel AI SDK `useChat` or polling | Live updates |
| **Fonts** | Geist Sans + Geist Mono | Typography |

---

## 5. Authentication & Demo Login

### 5.1 Authentication Flow

SecurePulse uses **Stack Auth** for all authentication:

- **Google OAuth** — One-click sign-in via `app.signInWithOAuth("google")`
- **GitHub OAuth** — One-click sign-in via `app.signInWithOAuth("github")`
- **Email/Password** — Redirects to Stack Auth handler at `/handler/signin`

On successful auth:
1. Stack Auth SDK provides the user session automatically
2. Server-side `getCurrentUser()` syncs Stack Auth user → local Prisma DB
3. If user doesn't exist in DB, auto-creates with `developer` role
4. Returns `{ id, email, name, avatarUrl, role, stackAuthId }`

### 5.2 Demo Login Modal

**Trigger:** Purple gradient "Try Demo" button below sign-in form on the sign-in page.

**Modal UI:**
- Dark overlay backdrop (click to dismiss)
- Header: "Explore SecurePulse" title + subtitle + close (X) button
- Error banner (if login fails)
- 3 role cards in a responsive grid (1 col mobile, 3 col desktop)
- Footer info bar with password hint

**Role Cards:**

| Role | Color | Icon | Email | Description |
|------|-------|------|-------|-------------|
| **Admin** | Red (#dc2626) | 🛡️ | `rao.vinu+admin@gmail.com` | Full platform access and configuration |
| **Manager** | Amber (#d97706) | 📊 | `rao.vinu+manager@gmail.com` | Security oversight and team management |
| **Developer** | Blue (#2563eb) | 💻 | `rao.vinu+developer@gmail.com` | Hands-on security scanning and monitoring |

**Each card contains:**
- Colored header with icon, role name, description
- Capabilities list with colored checkmarks:
  - **Admin:** Security Dashboard, Manage Repositories, Run & Monitor Scans, Alert Triage & Assignment, Scan Queue Management, User & Role Administration, Full Audit Log Access
  - **Manager:** Security Dashboard, View Repositories, Monitor Scan Results, Alert Triage & Assignment, Queue Status Overview, Audit Log Access
  - **Developer:** Personal Dashboard, Connect GitHub & Docker, Trigger Security Scans, View Scan Findings, Review & Resolve Alerts
- Login button ("Login as [Role]") with role-specific color
- Email displayed below button

**Login Flow:**
1. User clicks "Login as Admin" → button shows spinner
2. POST to Stack Auth sign-in with email + password `SecurePulse@123`
3. On success → store token → redirect to dashboard
4. On error → show error banner in modal

**Keyboard:** Escape key closes modal

---

## 6. Role-Based Access Control (RBAC)

### 6.1 Roles

| Role | Description | Scope |
|------|-------------|-------|
| **Admin** | Full platform access | Organization-wide |
| **Security Admin** | Security monitoring | Organization-wide |
| **Manager** | Team oversight | Team-scoped |
| **Developer** | Personal monitoring | Personal repos only |

### 6.2 Permission Matrix

| Feature | Admin | Security Admin | Manager | Developer |
|---------|-------|---------------|---------|-----------|
| Dashboard | ✅ All data | ✅ All data | ✅ Team data | ✅ Personal data |
| Repositories | ✅ All + manage | ✅ View all | ✅ View team | ✅ Own repos |
| Connect GitHub/Docker | ✅ | ✅ | ❌ | ✅ |
| Trigger Scans | ✅ All repos | ✅ All repos | ❌ | ✅ Own repos |
| View Scans | ✅ All | ✅ All | ✅ Team | ✅ Own |
| Scan Queue | ✅ Full control | ✅ View + pause | ❌ | ❌ |
| Alerts | ✅ All + assign | ✅ All + assign | ✅ Team + assign | ✅ Own + resolve |
| Admin Panel | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| Role Assignment | ✅ | ❌ | ❌ | ❌ |
| Customer Management | ✅ | ❌ | ❌ | ❌ |
| Audit Log | ✅ Full | ✅ Full | ✅ Team | ❌ |
| Settings | ✅ All tabs | ✅ Scan config | ❌ | ❌ |
| Queue Config | ✅ Edit | ✅ View | ❌ | ❌ |

### 6.3 Role Switching

Users with multiple roles can switch between them via a dropdown in the sidebar/navbar. The active role determines the visible nav items and data scope.

---

## 7. Navigation & Layout

### 7.1 Sidebar Navigation

The app uses a collapsible sidebar (`SidebarProvider` from shadcn/ui):

**Header:**
- Shield icon (emerald) + "SecurePulse" text
- Links to `/dashboard`

**Navigation Group:**
- 📊 Dashboard → `/dashboard`
- 🔗 Repositories → `/repositories`
- 🔍 Scans → `/scans`
- ⚠️ Alerts → `/alerts`

**Management Group (conditional by role):**
- ⚙️ Admin → `/admin` *(Admin only)*
- 📋 Queue → `/scan-queue` *(Admin + Security Admin)*
- 📝 Audit Log → `/audit-log` *(Admin + Security Admin + Manager)*
- ⚙️ Settings → `/settings` *(Admin + Security Admin)*

**Footer:**
- User avatar + name + email
- Sign-out button (LogOut icon)

### 7.2 Top Header

- Sidebar trigger button (hamburger)
- Vertical separator
- "SecurePulse" breadcrumb text
- *(Optional)* Settings gear icon on far right

### 7.3 Main Content Area

- `flex-1 overflow-auto p-6`
- Wrapped in `<Suspense>` with skeleton fallback

---

## 8. Page-by-Page Feature Specifications

### 8.1 Sign-In Page

**Route:** `/signin`

**Layout:** Full-screen dark gradient background (`from-slate-950 via-slate-900 to-slate-950`), centered card.

**Components:**
1. **Logo** — Emerald shield icon in rounded bg + "SecurePulse" title + subtitle
2. **Google OAuth button** — Full-width, primary, Google SVG icon
3. **GitHub OAuth button** — Full-width, outline, GitHub SVG icon
4. **Separator** — "or" divider
5. **Email sign-in button** — Full-width, secondary, redirects to `/handler/signin`
6. **Try Demo button** — Purple gradient, below separator, opens demo modal

**Redirect:** If user is already authenticated, redirect to `/dashboard`

---

### 8.2 Dashboard

**Route:** `/dashboard`

**Data fetching:** Server Component with `Promise.all` for parallel DB queries.

#### 8.2.1 Welcome Header
- "Dashboard" heading (text-2xl font-bold)
- "Welcome back, {name}" subtitle (text-muted-foreground)

#### 8.2.2 Stat Cards (4-card grid)

| Card | Icon | Value | Subtitle | Click Target |
|------|------|-------|----------|-------------|
| Repositories | GitBranch | `{repoCount}` | "GitHub repos connected" | `/repositories` |
| Docker Images | Container | `{imageCount}` | "Images monitored" | `/repositories` |
| Total Scans | Scan | `{scanCount}` | "Scans performed" | `/scans` |
| Open Alerts | AlertTriangle | `{totalAlerts}` | "Require attention" | `/alerts` |

Layout: `grid gap-4 md:grid-cols-2 lg:grid-cols-4`

All cards are **clickable** — navigate to respective pages on click.

#### 8.2.3 Security Score Widget (NEW — needs implementation)

- **Position:** Left side of a 2-column grid below stat cards
- **Visualization:** SVG radial ring chart, 0-100 score
- **Calculation:** `score = (scanPassRate × 50%) + ((1 - severityPenalty) × 50%)`
  - `scanPassRate` = completed scans / total scans
  - `severityPenalty` = weighted sum: critical×0.4 + high×0.2 + medium×0.1 + low×0.05
- **Color coding:**
  - 90-100: Green (#22c55e) — "Excellent"
  - 70-89: Yellow (#eab308) — "Good"
  - 50-69: Orange (#f97316) — "Fair"
  - 25-49: Red (#ef4444) — "Poor"
  - 0-24: Dark Red (#dc2626) — "Critical"
- **Display:** Large score number in center, label below, ring around

#### 8.2.4 Severity Breakdown Bars (NEW — needs implementation)

- **Position:** Right side of security score
- **Bars:** 4 progress bars (Critical=red, High=amber, Medium=blue, Low=green)
- **Each bar shows:** severity label, count, visual progress bar

#### 8.2.5 30-Day Scan Trend Chart (NEW — needs implementation)

- **Position:** Full-width below score/severity section
- **Type:** Bar chart with date labels on X axis
- **Bars:** Stacked — completed (green) vs failed (red) per day
- **Data:** Last 30 days from `/api/dashboard/trends`
- **Implementation:** Inline SVG (no charting library)

#### 8.2.6 Alert Severity Card (Existing)

- Lists Critical, High, Medium, Low with icons and badge counts
- Icons: ShieldAlert (red), AlertTriangle (orange/yellow), ShieldCheck (blue)

#### 8.2.7 Recent Scans Card (Existing)

- Shows last 5 scans with repo name, scan type, date, status badge, alert count
- Empty state: "No scans yet. Connect a repository to get started."

---

### 8.3 Repositories

**Route:** `/repositories`

#### 8.3.1 Page Header
- "Repositories" heading + subtitle
- Action buttons (top-right):
  - **Refresh Repos** button (RefreshCw icon) — calls `POST /api/repos/refresh`
  - **Connect GitHub** button (Plus icon) — opens connect dialog

#### 8.3.2 Connect GitHub Dialog

**Two methods:**

1. **GitHub OAuth** (if `NEXT_PUBLIC_GITHUB_CLIENT_ID` is set)
   - "Connect with GitHub OAuth" button
   - Redirects to `/api/github/authorize`

2. **Personal Access Token (PAT)**
   - Token input (password field, placeholder "ghp_...")
   - Label input (optional, e.g., "personal", "work")
   - Help text with link to GitHub token creation page
   - "Connect with Token" button
   - Validates token against `https://api.github.com/user`
   - On success: stores token → auto-refreshes repos → closes dialog

#### 8.3.3 Connect Docker Hub Dialog (MISSING — needs implementation)

- Username input field
- "Connect" button
- Calls Docker Hub API to discover public images
- Stores images in DockerImage table

#### 8.3.4 GitHub Repository Cards

Layout: `grid gap-3 md:grid-cols-2 lg:grid-cols-3`

Each card shows:
- **Header:** `fullName` (truncated) + external link icon (opens repo URL)
- **Metadata:** visibility badge (public/private), language, default branch
- **Footer:** scan count + "Scan" dropdown button + last scanned date
- **Scan Dropdown:** Secret Scan, SAST, Dependency Audit, Full Scan
  - Each shows label + description
  - Triggers `POST /api/scans` with `{ repoId, scanType }`
  - Shows loading spinner while scanning
  - Shows ✅ findings count or ❌ failed on completion

**Empty state:** "No repositories connected. Connect your GitHub account or add a PAT to get started."

#### 8.3.5 Docker Image Cards

Same grid layout. Each card shows:
- imageName, namespace/repository
- Scan count + last scanned date

#### 8.3.6 Scan Type Dropdown per Repo (ENHANCED — needs implementation)

For GitHub repos — dropdown options:
- Secret Scan (TruffleHog)
- SAST (Semgrep)
- Malware (VirusTotal)
- Dependencies (npm audit)
- Full Scan (all 4)

For Docker images — dropdown options:
- Secret Scan (Gitleaks)
- CVE Scan (Trivy)
- Full Scan (both)

#### 8.3.7 Clear All Buttons (MISSING — needs implementation)

- "Clear All Repos" button with confirmation dialog
- "Clear All Images" button with confirmation dialog
- Calls `DELETE /api/repos/github/all` and `DELETE /api/repos/docker/all`

---

### 8.4 Scans

**Route:** `/scans`

#### 8.4.1 Page Header
- "Scans" heading + subtitle
- Queue status badges (top-right): Active, Waiting, Completed, Failed — live counts

#### 8.4.2 Queue Control Buttons (MISSING — needs implementation)

Row of action buttons (Admin/Security Admin only):
- **Pause Queue** — `POST /api/scan-queue/pause`
- **Resume Queue** — `POST /api/scan-queue/resume`
- **Stop All Pending** — stops waiting jobs
- **Clear All Scans** — with confirmation dialog

#### 8.4.3 Scan Summary Stats (MISSING — needs implementation)

4 stat cards above table:
- **Pass Rate** — % of completed vs total, color-coded (green >80%, yellow >50%, red)
- **Avg Duration** — average scan time
- **Scan Types** — badges showing distribution
- **Active Scans** — currently running count

#### 8.4.4 Filter Bar (MISSING — needs implementation)

- **Status dropdown:** All / Pending / Running / Completed / Failed
- **Scan Type dropdown:** TruffleHog / Gitleaks / Trivy / Semgrep / Dependencies / VirusTotal
- **Clear Filters** button with result count badge
- Client-side filtering on the table

#### 8.4.5 Tab Navigation (MISSING — needs implementation)

Tabs: **All** | **Running** | **Completed** | **Failed**

Each tab filters the scan table. Under the "Failed" tab, show:
- "Retry All Failed" button
- "Clear Failed" button

#### 8.4.6 Scans Table (Existing — needs enhancement)

| Column | Content |
|--------|---------|
| Target | Repo fullName or Docker imageName |
| Scan Type | Human label (e.g., "Secret Scan (TruffleHog)") |
| Status | Badge: completed/failed/pending/running |
| Alerts | Count badge (destructive if >0) |
| Started | Timestamp |
| Completed | Timestamp or "—" |
| Duration | Calculated (completedAt - startedAt) |
| Actions | Retry button (if failed), Delete button |

**Scan Type Labels:**

| Internal Name | Display Label |
|--------------|--------------|
| `scan-github` | Secret Scan (TruffleHog) |
| `scan-docker` | Secret Scan (Gitleaks) |
| `scan-docker-vuln` | CVE Scan (Trivy) |
| `scan-sast` | SAST (Semgrep) |
| `scan-malware` | Malware (VirusTotal) |
| `scan-deps` | Dependencies (npm audit) |

#### 8.4.7 Bulk Operations (MISSING — needs implementation)

- Checkbox column for multi-select
- "Select All" checkbox in header (operates on filtered results)
- "Delete Selected" button
- "Retry Selected" button (for failed scans)

---

### 8.5 Alerts

**Route:** `/alerts`

#### 8.5.1 Severity Ring Chart (MISSING — needs implementation)

- SVG donut chart showing proportional severity distribution
- Colors: Critical=red, High=amber, Medium=blue, Low=green
- Total count in center
- Color legend below

#### 8.5.2 Stats Cards (MISSING — needs full implementation)

Grid of stat cards: Open, Acknowledged, Resolved, Total, Critical count

#### 8.5.3 Tab Navigation (Existing)

Tabs: **All** | **Open** | **Acknowledged** | **Resolved**

#### 8.5.4 Alerts Table (Existing)

| Column | Content |
|--------|---------|
| Severity | Color-coded badge (critical=red, high=orange, medium=default, low=secondary) |
| Title | Alert title |
| Source | Repo name or image name |
| File | `filePath:lineNumber` |
| Status | Badge |
| Created | Date |
| Actions | Acknowledge button + Resolve button (with dialog) |

#### 8.5.5 Acknowledge Action (Existing)

- Click "Acknowledge" button
- POST to `/api/alerts/{id}/acknowledge`
- Updates status to "acknowledged"
- Refreshes page via `router.refresh()`

#### 8.5.6 Resolve Action (Existing)

- Click "Resolve" → opens dialog
- Textarea for resolution notes
- "Mark as Resolved" button
- POST to `/api/alerts/{id}/resolve` with `{ notes }`
- Creates AlertResolution record

#### 8.5.7 Alert Assignment (MISSING — needs implementation)

- "Assign" button on each alert row
- Opens dialog with user dropdown (team members)
- POST to create AlertAssignment
- Assigned user sees alert in their view

---

### 8.6 Scan Queue (Admin)

**Route:** `/scan-queue`
**Access:** Admin + Security Admin only

#### 8.6.1 Queue Status Cards

Live-updating cards (5s polling):
- **Active** — currently processing
- **Waiting** — in queue
- **Completed** — total completed
- **Failed** — total failed
- **Delayed** — delayed jobs
- **Paused** — yes/no indicator

#### 8.6.2 Tabs

**Scan Logs** | **Error Patterns** | **Failed Scans** | **Configuration** (Admin only)

#### 8.6.3 Scan Logs Tab

- Table of all scans with status, type, repo/image, timestamps
- Filterable by status and scan type

#### 8.6.4 Error Patterns Tab (MISSING — needs implementation)

- Table of error fingerprints with:
  - Pattern (normalized error template)
  - Occurrences count
  - Affected repos/images count
  - First/Last seen
- "Retry All" button per pattern (retries only scans matching that fingerprint)

#### 8.6.5 Failed Scans Tab

- Table of failed scans with error messages
- "Retry" button per scan
- "Retry All Failed" bulk button

#### 8.6.6 Configuration Tab (Admin only) (MISSING — needs implementation)

Editable form fields:
- **Concurrency** — slider/number input (1-20, default 5)
- **Auto Scan on Connect** — toggle (default true)
- **Pause on Failure** — toggle (default true)
- **Max Consecutive Fails** — number input (default 3)
- "Save Configuration" button → PUT `/api/scan-queue/config`

**Pause Banner:** When queue is paused, show a prominent warning banner with the pause reason and a "Resume Queue" button.

---

### 8.7 Admin Panel

**Route:** `/admin`
**Access:** Admin only

#### 8.7.1 System Stats Cards (Existing)

3 cards: Total Users, Total Scans, Total Alerts

#### 8.7.2 User Management (Existing — needs enhancement)

**Users Table:**
- Name, Email, Role badge, Joined date
- **Add Role** button per user (MISSING) — opens dropdown with available roles
- **Remove Role** button per user (MISSING) — dropdown of current roles to remove

#### 8.7.3 Customer Management (MISSING — needs implementation)

**Add Customer Form:**
- Name input
- Domain input
- "Add Customer" button

**Customers Table:**
- Name, Domain, Created date
- Delete button with confirmation

**Assign Project Form:**
- Customer dropdown
- Project name input
- "Create Project" button

#### 8.7.4 Audit Log (Existing — basic)

Table of recent 20 audit logs: Action, Resource, User, Time

---

### 8.8 Audit Log

**Route:** `/audit-log`
**Access:** Admin, Security Admin, Manager

#### 8.8.1 Full Audit Log Page (MISSING — needs implementation)

- **Filters:** Action type, Resource type, User, Date range
- **Table:** Action badge, Resource type + ID, User email, Timestamp, Details expandable
- **Pagination:** Load more / infinite scroll
- **Export:** CSV download button
- **Tamper-proof:** Logs are immutable once created

---

### 8.9 Settings

**Route:** `/settings`
**Access:** Admin, Security Admin

#### 8.9.1 Tabs

**Scan Configuration** | **Import/Export** | **Integrations**

#### 8.9.2 Scan Configuration Tab

Same as Scan Queue Configuration tab:
- Concurrency slider
- Auto Scan on Connect toggle
- Pause on Failure toggle
- Max Consecutive Fails input

#### 8.9.3 Import/Export Tab

- Export all scan data as JSON
- Export alerts as CSV
- Import scan configuration

#### 8.9.4 Integrations Tab

- GitHub connection status
- Docker Hub connection status
- VirusTotal API key configuration
- Stack Auth project info

---

## 9. Security Scanners

### 9.1 Scanner Matrix

| Scanner | Target | Internal Name | Detection Type | Implementation |
|---------|--------|--------------|---------------|----------------|
| **TruffleHog** | GitHub repos | `scan-github` | Secrets (API keys, tokens, credentials) | CLI tool in Docker / regex in Next.js |
| **Gitleaks** | Docker images | `scan-docker` | Secrets in container layers | CLI tool in Docker / regex in Next.js |
| **Trivy** | Docker images | `scan-docker-vuln` | CVEs (OS-level vulnerabilities) | CLI tool — needs serverless alternative |
| **Semgrep** | GitHub repos | `scan-sast` | SAST (SQL injection, XSS, insecure crypto) | CLI tool in Docker / regex in Next.js |
| **VirusTotal** | GitHub repos | `scan-malware` | Malware via 70+ AV engines | REST API (needs `VIRUSTOTAL_API_KEY`) |
| **npm audit** | GitHub repos | `scan-deps` | Dependency vulnerabilities | `npm audit` CLI / OSV.dev API in Next.js |

### 9.2 Current Next.js Scanner Implementations

The SecurePulse Next repo already has **3 built-in serverless scanners** that work via GitHub API (no CLI tools needed):

1. **Secret Scanner** (`src/lib/scanners/secret-scanner.ts`)
   - Fetches repo tree via GitHub API
   - Scans file contents against 14 regex patterns
   - Detects: AWS keys, GitHub tokens, API keys, private keys, JWT secrets, DB URLs, Slack/Stripe/SendGrid/Twilio/Google tokens, hardcoded passwords, bearer tokens
   - Max 50 files per scan, skips files >100KB
   - Redacts matched secrets in output

2. **SAST Scanner** (`src/lib/scanners/sast-scanner.ts`)
   - Pattern-based static analysis
   - Detects: SQL injection, XSS (innerHTML, dangerouslySetInnerHTML), eval(), command injection, insecure random, hardcoded IPs, console.log, non-HTTPS URLs, disabled SSL, path traversal, weak crypto, CORS wildcard
   - 14 SAST rules with file extension filtering

3. **Dependency Scanner** (`src/lib/scanners/dependency-scanner.ts`)
   - Reads `package.json` and `requirements.txt` from repo
   - Queries **OSV.dev API** for known vulnerabilities
   - Batch queries (20 packages per request)
   - Maps OSV severity to critical/high/medium/low
   - Supports npm and PyPI ecosystems

### 9.3 Scanners Needing Serverless Adaptation

For Vercel deployment, these CLI-based scanners need alternatives:

| Scanner | Docker Approach | Serverless Alternative |
|---------|----------------|----------------------|
| **TruffleHog** | CLI binary | ✅ Already have regex scanner |
| **Gitleaks** | CLI binary | Regex scanner adapted for Docker |
| **Trivy** | CLI binary | Use Trivy cloud API or OSV.dev for container CVEs |
| **Semgrep** | CLI via pip | ✅ Already have regex scanner |
| **VirusTotal** | REST API | ✅ Same REST API approach |
| **npm audit** | CLI | ✅ Already using OSV.dev API |

---

## 10. Scan Orchestration Engine

### 10.1 Overview

The scan orchestration system manages the lifecycle of all security scans:
1. **Queuing** — Jobs created when user triggers scan or on auto-queue
2. **Priority** — User-triggered (priority 1) vs auto-queued (priority 10)
3. **Execution** — Parallel execution with configurable concurrency (default 5)
4. **Cleanup** — Post-scan resource cleanup
5. **Error handling** — Fingerprint-based error correlation
6. **Auto-pause** — Pauses after N consecutive failures

### 10.2 Serverless Adaptation

In the Docker version, Bull queue (Redis-backed) handles orchestration. For Vercel:

**Option A: Database-backed queue**
- `ScanJob` table with status (pending/running/completed/failed), priority, createdAt
- Vercel Cron polls for pending jobs every 30s
- Process via serverless function with timeout

**Option B: Upstash QStash**
- HTTP-based message queue designed for serverless
- Supports delayed messages, retries, dead letter queues
- No Redis needed

**Option C: Vercel KV + Cron**
- Store queue state in Vercel KV (Redis)
- Cron triggers processing function

### 10.3 Configuration Model

```prisma
model ScanConfig {
  id                  String  @id @default("singleton")
  concurrency         Int     @default(5)
  autoScanOnConnect   Boolean @default(true)
  pauseOnFailure      Boolean @default(true)
  maxConsecutiveFails  Int     @default(3)
  isPaused            Boolean @default(false)
  pauseReason         String?
  consecutiveFails    Int     @default(0)
  updatedAt           DateTime @updatedAt
}
```

### 10.4 Error Correlation

```prisma
model ScanErrorPattern {
  id             String   @id @default(uuid())
  fingerprint    String   @unique
  pattern        String   // Normalized error template
  sampleError    String   // Original error message
  occurrences    Int      @default(1)
  affectedRepos  Json     @default("[]") // String[] of repo IDs
  affectedImages Json     @default("[]") // String[] of image IDs
  firstSeen      DateTime @default(now())
  lastSeen       DateTime @default(now())
}
```

**Fingerprint algorithm:**
1. Normalize error: strip UUIDs, timestamps, file paths, URLs
2. SHA-256 hash of normalized string
3. Upsert ScanErrorPattern by fingerprint

### 10.5 Job Priority

| Source | Priority Value | Description |
|--------|---------------|-------------|
| User-triggered scan | `1` | Highest — runs before everything |
| Retry (manual) | `1` | Same as user-triggered |
| Auto-queue (connect) | `10` | Background — after user scans |
| Scheduled (daily cron) | `10` | Background |

### 10.6 Job Options

| Option | Value | Purpose |
|--------|-------|---------|
| Timeout | 10 minutes | Kill hung scans |
| Attempts | 2 | 1 initial + 1 retry |
| Backoff | Exponential, 5s base | Wait between retries |
| Auto-queue cap | 50 per batch | Prevent queue flooding |

### 10.7 Scheduled Scans

- **Schedule:** Daily at 2 AM UTC
- **Implementation:** Vercel Cron Job → `POST /api/cron/scheduled-scan`
- **Behavior:** Queues full scan for all repos/images that haven't been scanned in 24h
- **Dedup:** Skip if a scan is already pending/running for the same asset

---

## 11. API Reference

### 11.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| — | Stack Auth SDK handles | Google/GitHub OAuth + email/password |

### 11.2 Repositories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/repos/connect` | Connect GitHub PAT | Any |
| POST | `/api/repos/refresh` | Refresh/discover repos | Any |
| GET | `/api/repos` | List user repos | Any |
| DELETE | `/api/repos/github/all` | Delete all GitHub repos | Admin |
| DELETE | `/api/repos/docker/all` | Delete all Docker images | Admin |
| POST | `/api/repos/docker/connect` | Connect Docker Hub | Any |

### 11.3 Scans

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/scans` | List scans | Any |
| POST | `/api/scans` | Trigger scan | Any |
| POST | `/api/scans/{id}/retry` | Retry failed scan | Any |
| DELETE | `/api/scans/{id}` | Delete scan | Any |
| POST | `/api/scans/bulk-delete` | Bulk delete scans | Any |

### 11.4 Alerts

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/alerts` | List alerts | Any |
| GET | `/api/alerts/stats` | Alert statistics | Any |
| POST | `/api/alerts/{id}/acknowledge` | Acknowledge alert | Any |
| POST | `/api/alerts/{id}/resolve` | Resolve with notes | Any |
| POST | `/api/alerts/{id}/assign` | Assign to user | Manager+ |

### 11.5 Scan Queue

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/scan-queue/status` | Queue counts | Admin |
| GET | `/api/scan-queue/config` | Get config | Admin |
| PUT | `/api/scan-queue/config` | Update config | Admin |
| POST | `/api/scan-queue/pause` | Pause queue | Admin |
| POST | `/api/scan-queue/resume` | Resume queue | Admin |
| POST | `/api/scan-queue/retry` | Retry failed scans | Admin |
| GET | `/api/scan-queue/errors` | Error patterns | Admin |
| GET | `/api/scan-queue/failures` | Failed scans | Admin |
| GET | `/api/scan-queue/logs` | All scan logs | Admin |

### 11.6 Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/stats` | Summary stats | Any |
| GET | `/api/dashboard/trends` | 30-day scan trends | Any |

### 11.7 Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List all users | Admin |
| POST | `/api/admin/users/{id}/roles` | Add role to user | Admin |
| DELETE | `/api/admin/users/{id}/roles/{roleId}` | Remove role | Admin |
| POST | `/api/admin/customers` | Create customer | Admin |
| DELETE | `/api/admin/customers/{id}` | Delete customer | Admin |

### 11.8 Audit

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/audit` | List audit logs | Admin+ |
| GET | `/api/audit/export` | Export as CSV | Admin |

### 11.9 GitHub OAuth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/github/authorize` | Start OAuth flow | Any |
| GET | `/api/github/callback` | OAuth callback | — |

### 11.10 Cron

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/cron/scheduled-scan` | Daily scan trigger | Vercel Cron |

---

## 12. Database Schema

### 12.1 Existing Models (in SecurePulse Next)

- `User` — id, stackAuthId, email, name, avatarUrl, timestamps
- `Role` — id, name, description
- `UserRole` — userId + roleId (unique together)
- `GitHubRepository` — userId, repoName, repoUrl, fullName, visibility, language, description, lastScanned
- `DockerImage` — userId, imageName, imageUrl, namespace, repository, lastScanned
- `RepositoryScan` — githubRepoId?, dockerImageId?, scanType, status, startedAt, completedAt, errorMessage, summary (JSON)
- `Alert` — scanId, severity, title, description, filePath, lineNumber, commit, status
- `AlertAssignment` — alertId, assignedTo, assignedBy
- `AlertResolution` — alertId (unique), resolvedBy, resolutionNotes
- `OAuthToken` — userId, provider, label, accessToken, refreshToken, expiresAt
- `AuditLog` — userId?, action, resourceType, resourceId?, metadata (JSON), ipAddress, userAgent

### 12.2 Models to Add

```prisma
model ScanConfig {
  id                  String   @id @default("singleton")
  concurrency         Int      @default(5)
  autoScanOnConnect   Boolean  @default(true)
  pauseOnFailure      Boolean  @default(true)
  maxConsecutiveFails Int      @default(3)
  isPaused            Boolean  @default(false)
  pauseReason         String?
  consecutiveFails    Int      @default(0)
  updatedAt           DateTime @updatedAt
}

model ScanErrorPattern {
  id             String   @id @default(uuid())
  fingerprint    String   @unique
  pattern        String
  sampleError    String
  occurrences    Int      @default(1)
  affectedRepos  Json     @default("[]")
  affectedImages Json     @default("[]")
  firstSeen      DateTime @default(now())
  lastSeen       DateTime @default(now())
}

model Customer {
  id        String    @id @default(uuid())
  name      String
  domain    String?
  projects  Project[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Project {
  id         String   @id @default(uuid())
  name       String
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### 12.3 Fields to Add to Existing Models

- `RepositoryScan.startedAt` — change from `@default(now())` to nullable, set when scan starts running
- `RepositoryScan.priority` — Int, default 10
- `User.customerId` — optional FK to Customer

---

## 13. Real-Time Features

### 13.1 WebSocket Events (Docker version)

The Docker version uses Socket.IO for real-time updates:

| Event | Payload | Trigger |
|-------|---------|---------|
| `scan:started` | `{ scanId, scanType, repoId }` | Scan begins processing |
| `scan:completed` | `{ scanId, status, alertCount }` | Scan finishes |
| `scan:failed` | `{ scanId, error }` | Scan fails |
| `alert:new` | `{ alertId, severity, title }` | New alert created |
| `queue:status` | `{ active, waiting, completed, failed }` | Queue state change |

### 13.2 Serverless Alternative

For Vercel (no persistent WebSocket):

**Option A: Polling**
- Client polls `/api/scans?status=running` every 5s when scans are active
- Client polls `/api/scan-queue/status` every 5s on queue page

**Option B: Server-Sent Events (SSE)**
- `GET /api/events` — streaming endpoint
- Sends scan status updates as they happen

**Option C: Vercel AI SDK streaming**
- Use `unstable_after` or streaming response for scan progress

---

## 14. Non-Functional Requirements

### 14.1 Performance

- Dashboard loads in < 2s (server-rendered)
- Scan trigger API responds in < 1s (creates job, returns immediately)
- Individual scan completes in < 10 minutes
- Page navigation < 500ms (client-side)

### 14.2 Security

- All sensitive data encrypted at rest (Neon manages this)
- HTTPS everywhere (Vercel default)
- OAuth tokens stored encrypted in DB
- Role-based API authorization on every endpoint
- Audit logs immutable (no UPDATE/DELETE operations)
- CSRF protection via Next.js defaults

### 14.3 Reliability

- 99.9% uptime (Vercel SLA)
- Automatic failover (Vercel multi-region)
- Database backups (Neon managed)
- Scan retries with exponential backoff

### 14.4 Scalability

- Serverless auto-scaling (Vercel)
- Database connection pooling (Neon)
- Max 50 assets per auto-queue batch
- Scan results paginated (100 per page)

---

## 15. Gap Analysis — What Needs to Be Built

### Priority 1 — Core Feature Parity (HIGH)

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| 1 | Demo Login Modal | S | "Try Demo" button + 3 role cards + one-click login |
| 2 | Scan Tabs + Filters | M | All/Running/Completed/Failed tabs, status/type filter dropdowns |
| 3 | Scan Queue Controls | M | Pause/Resume/Stop/Clear buttons with queue status badges |
| 4 | Scan Retry + Delete | S | Per-row and bulk operations |
| 5 | Docker Hub Connect | M | Username dialog, Docker Hub API discovery |
| 6 | Alert Assignment | M | Assign to user workflow |
| 7 | Role Management | M | Admin add/remove roles UI |
| 8 | Scan Queue Page | L | Full admin page with 4 tabs |
| 9 | Scan Config API | M | CRUD for ScanConfig, error patterns |
| 10 | Error Correlation | M | Fingerprinting + grouping + batch retry |
| 11 | Auto-queue on Connect | S | Trigger full scan after GitHub/Docker connect |
| 12 | Scheduled Scans | S | Vercel Cron at 2 AM UTC |

### Priority 2 — Dashboard Enhancements (MEDIUM)

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| 13 | Security Score Widget | M | SVG radial chart with score calculation |
| 14 | Severity Breakdown Bars | S | Progress bars for alert severities |
| 15 | 30-Day Trend Chart | M | SVG bar chart from trends API |
| 16 | Clickable Stat Cards | S | Navigate on click |
| 17 | Alert Severity Ring | M | SVG donut chart on alerts page |
| 18 | Alert Stats Cards | S | Open/Ack/Resolved/Total counts |

### Priority 3 — Admin & Settings (MEDIUM)

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| 19 | Customer Management | M | CRUD for customers + projects |
| 20 | Full Audit Log Page | M | Filterable, paginated, exportable |
| 21 | Settings Page | M | Scan config, import/export, integrations tabs |
| 22 | Role Switching | S | Dropdown to switch active role |

### Priority 4 — Polish (LOW)

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| 23 | GitHub OAuth Connect | M | Alternative to PAT |
| 24 | Clear All Repos/Images | S | Bulk delete with confirmation |
| 25 | Real-time Updates | L | Polling or SSE for scan status |
| 26 | VirusTotal Integration | M | Malware scanning API |

**Effort Key:** S = Small (1-2 hours), M = Medium (3-6 hours), L = Large (1-2 days)

---

*This PRD serves as the complete blueprint for bringing SecurePulse Next to full feature parity with SecurePulse v1.4.1. Each section is designed to be actionable — a developer can pick up any section and implement it independently.*
