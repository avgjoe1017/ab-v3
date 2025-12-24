# Affirmation Beats Admin UI

Admin dashboard for managing Affirmation Beats sessions, jobs, users, and system health.

## Setup

### Prerequisites

1. Install dependencies:
```bash
pnpm install
```

2. Install bcryptjs in the API (if not already installed):
```bash
cd apps/api
bun add bcryptjs @types/bcryptjs
```

3. Create an admin user:
```bash
cd apps/api
bun scripts/create-admin-user.ts admin@example.com your-password ADMIN
```

### Environment Variables

Create `apps/admin/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### Running

1. Start the API server (if not already running):
```bash
cd apps/api
bun --watch src/index.ts
```

2. Start the admin UI:
```bash
cd apps/admin
pnpm dev
```

3. Open http://localhost:3001/admin/login

## Features

### Dashboard
- Overview stats (sessions, users, jobs)
- Job status breakdown
- Recent jobs list

### Sessions Management
- View all sessions (catalog, user-created, generated)
- Filter by source
- View session details
- Delete sessions (ADMIN only)

### Jobs Monitoring
- View all jobs with status
- Filter by status (pending, processing, completed, failed)
- Retry failed jobs (OPERATOR+)
- Real-time updates (auto-refresh every 10s)

### Users Management
- View all users
- See user entitlements (plan, status)
- View session counts per user

## Admin Roles

- **ADMIN**: Full access (delete sessions, manage users, etc.)
- **OPERATOR**: Can retry jobs, view everything (cannot delete)
- **READ_ONLY**: View-only access

## Authentication

Currently uses simple session-based authentication with in-memory token storage. For production, consider:
- JWT tokens with refresh
- Redis for session storage
- OAuth integration (Clerk, Auth0)

## API Routes

All admin routes are prefixed with `/admin/` and require authentication:
- `POST /admin/auth/login` - Login
- `POST /admin/auth/logout` - Logout
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/sessions` - List sessions
- `GET /admin/sessions/:id` - Session details
- `DELETE /admin/sessions/:id` - Delete session (ADMIN only)
- `GET /admin/jobs` - List jobs
- `GET /admin/jobs/:id` - Job details
- `POST /admin/jobs/:id/retry` - Retry job (OPERATOR+)
- `GET /admin/users` - List users

