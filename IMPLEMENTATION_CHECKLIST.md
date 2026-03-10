# SecurePulse Next - Implementation Checklist

Based on PRD-SecurePulse-Next.md and current state analysis.

## ✅ Already Implemented

- Stack Auth integration (Google/GitHub OAuth)
- Sign-in page with OAuth buttons
- Basic dashboard with 4 stat cards
- Repositories page with GitHub repos display
- GitHub PAT connect & refresh
- Basic scan trigger dropdown (4 types)
- Scans page with table
- Alerts page with 3 tabs (Open/Acknowledged/Resolved)
- Alert actions (Acknowledge/Resolve with notes)
- Admin page with user table
- Prisma schema with all models
- Built-in scanners: Secret (regex), SAST (regex), Dependency (OSV.dev)

## 🔴 CRITICAL - Must Implement Now

### 1. Dashboard Enhancements
- [ ] Security Score radial widget (0-100 with color coding)
- [ ] 30-day scan trend bar chart
- [ ] Make stat cards clickable (navigate to respective pages)
- [ ] Add progress bars for severity breakdown

### 2. All 6 Scan Types
Currently only 3 basic scanners exist. Need to add:
- [ ] TruffleHog scanner (external tool)
- [ ] Gitleaks scanner (for Docker images)
- [ ] Trivy scanner (CVE scanning)
- [ ] VirusTotal scanner (malware detection)
- [ ] Update scan dropdown to show all 6 types

### 3. Scans Page - Full Controls
- [ ] Tab navigation: All / Running / Completed / Failed
- [ ] Queue control buttons: Pause / Resume / Stop Pending / Clear All
- [ ] Filter dropdowns: Status, Scan Type
- [ ] Stats cards: Pass Rate, Avg Duration, Active Scans
- [ ] Retry button for failed scans
- [ ] Delete button for scans
- [ ] Bulk operations (select multiple, delete/retry)
- [ ] Duration column (completedAt - startedAt)

### 4. Docker Hub Integration
- [ ] Connect Docker Hub dialog (username input)
- [ ] Docker Hub API integration
- [ ] Docker image discovery
- [ ] Docker image cards on repositories page
- [ ] Scan dropdown for Docker images (Gitleaks, Trivy)

### 5. Demo Login Modal
- [ ] "Try Demo" button on sign-in page
- [ ] Modal with 3 role cards (Admin/Manager/Developer)
- [ ] One-click login for each role
- [ ] Pre-seeded demo accounts

## 🟠 HIGH Priority

### 6. Scan Queue Management Page
- [ ] Create `/scan-queue` route (Admin only)
- [ ] Queue status display (active/waiting/completed/failed)
- [ ] Live queue logs
- [ ] Error pattern analysis
- [ ] Failed scans table with retry
- [ ] Queue configuration (concurrency, auto-scan toggle)

### 7. Alerts Enhancements
- [ ] Severity ring chart (SVG donut)
- [ ] Stats cards (Open/Acknowledged/Resolved/Total)
- [ ] Alert assignment workflow (assign to user)
- [ ] Bulk alert operations

### 8. Repository Page Enhancements
- [ ] Clear All Repos button with confirmation
- [ ] Clear All Images button with confirmation
- [ ] Account filtering dropdown (for multiple GitHub accounts)
- [ ] Scan status indicators on cards

## 🟡 MEDIUM Priority

### 9. Admin Panel Enhancements
- [ ] Role management (add/remove roles for users)
- [ ] Customer management CRUD
- [ ] Full audit log page with filters

### 10. Settings Page
- [ ] Create `/settings` route
- [ ] Scan configuration tab
- [ ] Integrations tab
- [ ] Import/Export tab

### 11. Real-time Features
- [ ] WebSocket or polling for live scan updates
- [ ] Live queue status badges
- [ ] Toast notifications for scan completion

## 🟢 LOW Priority

### 12. Additional Features
- [ ] Role switching dropdown (for users with multiple roles)
- [ ] Scheduled scans (Vercel Cron)
- [ ] Auto-queue on GitHub/Docker connect
- [ ] GitHub OAuth connect (alternative to PAT)

---

## Implementation Order

**Week 1 Focus:**
1. Dashboard enhancements (score widget, trend chart, clickable cards)
2. All 6 scan types implementation
3. Scans page controls (tabs, filters, queue buttons)
4. Docker Hub integration

**Week 2 Focus:**
5. Demo login modal
6. Scan queue management page
7. Alerts enhancements
8. Admin panel improvements

**Week 3 Focus:**
9. Settings page
10. Real-time features
11. Polish & testing

---

## API Endpoints Needed

### Scans
- `POST /api/scan-queue/pause` - Pause queue
- `POST /api/scan-queue/resume` - Resume queue
- `POST /api/scan-queue/stop-pending` - Stop all pending
- `DELETE /api/scan-queue/clear` - Clear all scans
- `POST /api/scans/[id]/retry` - Retry failed scan
- `DELETE /api/scans/[id]` - Delete scan
- `GET /api/scan-queue/status` - Get queue status
- `GET /api/scan-queue/logs` - Get queue logs

### Dashboard
- `GET /api/dashboard/trends` - 30-day scan trends
- `GET /api/dashboard/security-score` - Calculate security score

### Docker
- `POST /api/repos/docker/connect` - Connect Docker Hub
- `POST /api/repos/docker/refresh` - Refresh images
- `DELETE /api/repos/docker/all` - Clear all images

### Repositories
- `DELETE /api/repos/github/all` - Clear all repos

### Settings
- `GET /api/settings/scan-config` - Get scan configuration
- `PUT /api/settings/scan-config` - Update scan configuration

---

## Component Files Needed

### Dashboard
- `src/components/security-score-widget.tsx`
- `src/components/scan-trend-chart.tsx`
- `src/components/clickable-stat-card.tsx`

### Scans
- `src/components/scan-tabs.tsx`
- `src/components/scan-filters.tsx`
- `src/components/scan-queue-controls.tsx`
- `src/components/scan-stats-cards.tsx`
- `src/components/retry-scan-button.tsx`
- `src/components/delete-scan-button.tsx`

### Docker
- `src/components/connect-docker-button.tsx`
- `src/components/connect-docker-dialog.tsx`

### Demo
- `src/components/demo-login-modal.tsx`
- `src/components/demo-role-card.tsx`

### Queue
- `src/app/(authenticated)/scan-queue/page.tsx`
- `src/components/queue-status-display.tsx`
- `src/components/queue-logs.tsx`

### Scanners
- `src/lib/scanners/trufflehog-scanner.ts`
- `src/lib/scanners/gitleaks-scanner.ts`
- `src/lib/scanners/trivy-scanner.ts`
- `src/lib/scanners/virustotal-scanner.ts`
