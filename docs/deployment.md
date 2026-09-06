# Qiskit Fall Fest 2026 — Production Deployment Guide

This guide provides step-by-step instructions for deploying the **Qiskit Fall Fest 2026** application to a production environment safely and reliably.

---

## 1. Prerequisites

Before starting deployment, verify that the production server meets the following requirements:

### Server & Runtime Requirements
- **Operating System**: Linux (Ubuntu 22.04 LTS recommended) or any Unix-like system.
- **Node.js**: `v18.x` or `v20.x` LTS (`node -v`).
- **npm**: `v9.x` or `v10.x` (`npm -v`).
- **PostgreSQL**: `v14.x`, `v15.x`, or `v16.x` (`psql --version`).
- **Git**: Installed for cloning repository updates (`git --version`).
- **Process Manager**: PM2 (`npm install -g pm2`) for process monitoring and automatic backend restarts.
- **Reverse Proxy**: Nginx for SSL termination, static frontend hosting, and proxying backend API traffic.
- **Domain & SSL**: Valid domain name pointing to the production server IP, with SSL certificates provisioned (e.g., Let's Encrypt / Certbot).

---

## 2. Project Structure

The project is structured as an npm workspace monorepo:

```text
Qiskit-Fall-Fest-2026/
├── backend/
│   ├── src/
│   │   ├── config/         # Database pool & environment variable mapping
│   │   ├── controllers/    # API endpoint handlers
│   │   ├── middleware/     # JWT authentication & validation middleware
│   │   ├── routes/         # Express API route declarations
│   │   ├── services/       # Core business logic (Registration, Attendance, Email, Certificates)
│   │   ├── seeds/          # Production database seed script (seed_events.js)
│   │   └── server.js       # Express HTTP server entry point
│   ├── tests/              # Node test runner integration tests
│   ├── uploads/            # Local filesystem storage for certificates
│   ├── .env.example        # Reference environment configuration
│   └── package.json        # Backend dependencies and scripts
├── database/
│   └── schema/             # PostgreSQL DDL files
│       ├── 00000000_run_all.sql             # Master schema file using psql \ir
│       ├── 20260906_create_events.sql
│       ├── 20260906_create_registrations.sql
│       ├── 20260906_create_organizers.sql
│       ├── 20260906_create_attendance.sql
│       ├── 20260906_create_attendance_sessions.sql
│       ├── 20260906_create_attendance_tokens.sql
│       ├── 20260906_create_certificates.sql
│       ├── 20260906_create_event_reminders.sql
│       ├── 20260906_create_teams.sql
│       ├── 20260906_create_team_members.sql
│       └── 20260906_create_hackathon_results.sql
├── docs/                   # System documentation & deployment guides
├── frontend/
│   ├── src/                # React source files (Pages, Components, Context)
│   ├── dist/               # Built static production bundle output
│   └── package.json        # Frontend Vite build dependencies
├── package.json            # Root workspace configuration
└── README.md
```

---

## 3. Clone the Repository

### [SERVER] On Production Server
Execute the following commands to clone the code repository and navigate into the project directory:

```bash
git clone https://github.com/<owner>/<repository>.git Qiskit-Fall-Fest-2026
cd Qiskit-Fall-Fest-2026
```

---

## 4. Install Dependencies

The project utilizes root npm workspaces (`frontend` and `backend`).

### [SERVER] On Production Server
Install all workspace dependencies from the root directory:

```bash
# Install dependencies for both frontend and backend workspaces
npm ci
```

*(Note: If `package-lock.json` is being updated in development, `npm install` may be run locally.)*

---

## 5. PostgreSQL Production Database

The production application uses **PostgreSQL** as its single source of truth.

### [SERVER] Configure PostgreSQL Database & User

Log into PostgreSQL as an administrative user and execute:

```sql
-- Create the production database
CREATE DATABASE qff26;

-- Create dedicated production database user
CREATE USER qff_admin WITH PASSWORD '<strong-production-db-password>';

-- Grant privileges to database user
GRANT ALL PRIVILEGES ON DATABASE qff26 TO qff_admin;
```

> **IMPORTANT**:
> - Never use development credentials (such as `balu0647` or `admin123`) in production.
> - Setting `DB_HOST=127.0.0.1` indicates that the database server is running locally on the same host machine as the Node.js backend.

### Verify Database Connection

Verify that PostgreSQL is running and accessible:

```bash
psql -h 127.0.0.1 -U qff_admin -d qff26 -c "SELECT current_database(), version();"
```

---

## 6. Apply Database Schema

The master database DDL is located at `database/schema/00000000_run_all.sql`. It relies on `psql` internal relative file include directives (`\ir`).

### [SERVER] Execute Master DDL Script

From the project root directory, navigate into `database/schema` and execute `00000000_run_all.sql` using `psql`:

```bash
cd database/schema
psql -h 127.0.0.1 -U qff_admin -d qff26 -f 00000000_run_all.sql
cd ../..
```

> **WARNING**:
> Do NOT drop or reset the database during normal deployment.

---

## 7. Seed Production Data

Initial event days and the primary organizer account are populated using the seed script `backend/src/seeds/seed_events.js`.

### [SERVER] Run Database Seed Script

Execute the seed script from the root workspace or backend folder:

```bash
# Executed from the project root directory:
node backend/src/seeds/seed_events.js
```

### Seed Output & Event Schedule
The seed establishes the four official event days:
- **Day 1**: `2026-09-07` — Quantum Foundations & Qiskit Workshop
- **Day 2**: `2026-09-08` — Quantum Algorithms & Lab Sessions
- **Day 3**: `2026-09-09` — Quantum Hackathon & Presentations
- **Day 4**: `2026-09-10` — Innovation & Project Showcase

### Organizer Account Notice
The seed initializes the default organizer account:
- **Email**: `admin@qiskitfallfest.com`
- **Initial Password**: `Admin@123`

> **CRITICAL SECURITY REQUIREMENT**:
> The default password `Admin@123` MUST be changed immediately after initial deployment using a direct database update or secure password change flow before opening the site to users.

---

## 8. Production Environment Variables

Create the production `.env` file at `backend/.env`.

### [SERVER] Create `backend/.env`

```ini
# Node Environment
NODE_ENV=production
PORT=5000

# PostgreSQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=qff26
DB_USER=qff_admin
DB_PASSWORD=<strong-production-db-password>

# SMTP Email Configuration (Nodemailer)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=<production-email@domain.com>
MAIL_PASSWORD=<production-gmail-app-password>
MAIL_FROM=<production-email@domain.com>
MAIL_FROM_NAME=Qiskit Fall Fest 2026

# Event & Reminder Configuration
EVENT_TIMEZONE=Asia/Kolkata
EVENT_REMINDER_TIME=07:00
PUBLIC_API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Production Security Secrets (Use long, cryptographically strong random strings)
JWT_SECRET=<64-byte-random-jwt-secret>
REMINDER_PROCESSOR_TOKEN=<64-byte-random-reminder-token>
```

> **SECURITY NOTES**:
> - Never commit `.env` files to Git control.
> - `JWT_SECRET` and `REMINDER_PROCESSOR_TOKEN` must be unique random strings generated for production (e.g., using `openssl rand -hex 32`).
> - If using Gmail SMTP (`smtp.gmail.com`), enable 2-Factor Authentication on the account and generate a 16-character **Gmail App Password**.

---

## 9. Backend Configuration

The backend connects to PostgreSQL using `pg.Pool` based on the configured environment parameters (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`). When `NODE_ENV=production`, SSL verification settings are configured appropriately for secure connections.

---

## 10. Frontend Configuration

The React frontend API endpoint is configured during the build step via Vite environment variables.

### [SERVER] Production API URL Setting

Set `VITE_API_BASE_URL` to point to your live production backend URL before running the build step. Create `frontend/.env.production`:

```ini
VITE_API_BASE_URL=https://api.yourdomain.com
```

> **WARNING**:
> Never build a production frontend with hardcoded `http://localhost:5000` URLs.

---

## 11. Build & Test Verification

Before starting or updating the production services, verify that all backend integration tests pass and that the frontend builds cleanly.

### [SERVER] Run Tests and Build Bundle

```bash
# 1. Execute backend test suite
npm test --workspace backend

# 2. Build frontend production assets
npm run build --workspace frontend
```

> **STOP**: If tests fail or the frontend build fails, do NOT proceed with deployment. Fix the error first.

---

## 12. Start the Production Backend

Manage the backend server using **PM2** to guarantee process resilience, automated restarts on failure, and background logging.

### [SERVER] Start / Reload PM2 Service

From the project root:

```bash
# Start backend using PM2
pm2 start backend/src/server.js --name "qff-backend"

# Save PM2 process state to restart on server reboot
pm2 save
pm2 startup
```

### Management Commands

```bash
# Check service status
pm2 status

# Inspect live stdout/stderr logs
pm2 logs qff-backend

# Restart backend after configuration update
pm2 restart qff-backend
```

---

## 13. Reverse Proxy & HTTPS (Nginx)

Host the compiled frontend static files (`frontend/dist`) and proxy `/api` requests to the Node.js backend (`http://127.0.0.1:5000`) using Nginx.

### Example Nginx Server Configuration (`/etc/nginx/sites-available/qiskitfallfest`)

```nginx
server {
    server_name yourdomain.com api.yourdomain.com;

    # Static Frontend Root
    location / {
        root /path/to/Qiskit-Fall-Fest-2026/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy to Express Backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable SSL via Certbot:

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## 14. Email Configuration & Verification Procedure

The application uses Nodemailer with SMTP. Delivery state is tracked per recipient in backend logs.

### Production Email Verification Procedure

1. Ensure `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, and `MAIL_FROM` are set in `backend/.env`.
2. Restart backend (`pm2 restart qff-backend`).
3. Log into the Organizer Dashboard (`/organizer`).
4. Send an announcement or test email to a controlled test mailbox.
5. Inspect live backend logs:
   ```bash
   pm2 logs qff-backend --lines 50
   ```
6. Verify log output confirms accepted recipients:
   ```text
   [ORGANIZER_EMAIL_SUCCESS] { recipientCount: 1, acceptedRecipients: ['test@domain.com'], rejectedRecipients: [] }
   ```
7. Verify receipt in test inbox.

---

## 15. Event Verification

Verify that all four official event days exist in PostgreSQL:

```bash
psql -h 127.0.0.1 -U qff_admin -d qff26 -c "SELECT event_id, event_name, event_date FROM events ORDER BY event_date;"
```

### Expected Output
```text
 event_id |                   event_name                   | event_date 
----------+------------------------------------------------+------------
 day-1    | Day 1: Quantum Foundations & Qiskit Workshop   | 2026-09-07
 day-2    | Day 2: Quantum Algorithms & Lab Sessions       | 2026-09-08
 day-3    | Day 3: Quantum Hackathon & Presentations       | 2026-09-09
 day-4    | Day 4: Innovation & Project Showcase           | 2026-09-10
(4 rows)
```

Verify count equals 4:

```bash
psql -h 127.0.0.1 -U qff_admin -d qff26 -c "SELECT COUNT(*) FROM events;"
```

---

## 16. Organizer Verification

Verify that the organizer record exists:

```bash
psql -h 127.0.0.1 -U qff_admin -d qff26 -c "SELECT organizer_id, email, created_at FROM organizers;"
```

*(Never print password hashes in public logs).*

Test organizer login through the live UI at `https://yourdomain.com/organizer`.

---

## 17. Registration Verification

Perform an end-to-end participant registration flow:

1. Open `https://yourdomain.com/register`.
2. Register a test user.
3. Verify record creation in PostgreSQL:
   ```bash
   psql -h 127.0.0.1 -U qff_admin -d qff26 -c "SELECT registration_id, full_name, email, created_at FROM registrations ORDER BY created_at DESC LIMIT 1;"
   ```
4. Refresh browser page to verify session persistence via JWT.
5. Log out.
6. Log in via `https://yourdomain.com/login`.
7. Attempt registering with the exact same email address.
8. Confirm that duplicate registration returns HTTP `409 Conflict` (`EMAIL_ALREADY_REGISTERED`).

---

## 18. Attendance & Dynamic QR Verification

Verify the 5-second dynamic QR code rotation system:

1. Log into Organizer Dashboard.
2. Select Day 1 attendance and click **Start Session**.
3. Verify QR code appears.
4. Observe the QR code graphic every 5 seconds:
   - Countdown visual counts down `5s → 4s → 3s → 2s → 1s`.
   - QR code graphic visually changes every 5 seconds.
5. Scan current QR code using a registered participant device/account.
6. Confirm attendance marks as `PRESENT`.
7. Save a screenshot of a QR code, wait 6 seconds, and attempt to scan it.
8. Confirm that expired QR code scan is rejected (`QR_TOKEN_EXPIRED`).
9. Click **Stop Session**.
10. Confirm subsequent QR token requests return HTTP `404 Not Found` (`ATTENDANCE_SESSION_NOT_FOUND`).

### PostgreSQL Database Inspection Commands

```sql
-- Check active/ended session state
SELECT id, event_id, organizer_id, status, started_at, ended_at
FROM attendance_sessions
ORDER BY created_at DESC LIMIT 5;

-- Inspect generated UUID tokens and 5-second expiration timestamps
SELECT id, attendance_session_id, token, expires_at, created_at
FROM attendance_tokens
ORDER BY created_at DESC LIMIT 10;

-- Inspect attendance logs
SELECT event_id, registration_id, status, marked_at
FROM attendance
ORDER BY marked_at DESC LIMIT 10;
```

---

## 19. Certificate Verification

1. Log into Organizer Dashboard.
2. Open Certificate Generation section.
3. Select an event (e.g. `day-1`) and certificate type.
4. Click **Preview Eligibility**.
5. Click **Generate Certificates**.
6. Verify output PDF generation and database entry in `certificates` table:
   ```bash
   psql -h 127.0.0.1 -U qff_admin -d qff26 -c "SELECT certificate_id, registration_id, certificate_type, created_at FROM certificates ORDER BY created_at DESC LIMIT 5;"
   ```

---

## 20. Security Checklist

- [ ] `.env` file is added to `.gitignore` and never committed to Git repository.
- [ ] Production database password is a strong, random password.
- [ ] `JWT_SECRET` is set to a unique 64-byte secret string.
- [ ] `REMINDER_PROCESSOR_TOKEN` is set to a unique private secret string.
- [ ] SMTP App Password is saved securely.
- [ ] HTTPS (SSL/TLS) is enabled across all public domains.
- [ ] PostgreSQL port `5432` is bound to local loopback (`127.0.0.1`) and shielded by firewall.
- [ ] Production organizer password is updated from default `Admin@123`.
- [ ] No development/test credentials exist in production database.
- [ ] No `http://localhost:5000` URLs exist in production frontend assets.
- [ ] Daily PostgreSQL database backup cron job is configured.
- [ ] Backend logging does not write passwords or JWT tokens to stdout/stderr logs.
- [ ] QR tokens expire strictly after 5 seconds (`NOW() + INTERVAL '5 seconds'`).
- [ ] Expired QR tokens are validated and rejected server-side.

---

## 21. Deployment Verification Checklist

### Database
- [x] Schema applied successfully (`00000000_run_all.sql`).
- [x] All 4 event days seeded.
- [x] Primary organizer account configured.
- [x] Tables `registrations`, `attendance`, `attendance_sessions`, `attendance_tokens`, `certificates` exist.

### Backend
- [x] PM2 process running cleanly (`pm2 status`).
- [x] PostgreSQL connection pool active.
- [x] Integration tests pass (`npm test --workspace backend`).
- [x] JWT authentication functional.
- [x] SMTP Email delivery verified.

### Frontend
- [x] Production build output generated (`npm run build --workspace frontend`).
- [x] `VITE_API_BASE_URL` points to live production backend.
- [x] Registration and participant dashboard working.

### Dynamic QR Attendance
- [x] Session start and stop controls working.
- [x] QR code rotates and visually changes every 5 seconds.
- [x] Expired tokens rejected server-side.
- [x] Attendance saved.

---

## 22. Troubleshooting Known Issues

### Error: `relation "registrations" does not exist`
- **Cause**: Database schema was not applied to the target database.
- **Fix**: Re-run `psql -h 127.0.0.1 -U qff_admin -d qff26 -f database/schema/00000000_run_all.sql` from `database/schema/`.

### Error: `password authentication failed for user "postgres"`
- **Cause**: Incorrect database password or user credentials in `backend/.env`.
- **Fix**: Verify `DB_USER` and `DB_PASSWORD` settings match the PostgreSQL user created during setup.

### Error: `relation "registrations_registration_id_seq" does not exist`
- **Cause**: Outdated code referencing an obsolete sequence name.
- **Note**: The current schema uses `registrations_id_seq`. Verify that the latest code update is deployed (`git pull`).

### Error: `ReferenceError: activeSessions is not defined`
- **Cause**: Outdated backend codebase running in-memory session tracking.
- **Fix**: Deploy the updated backend codebase which uses PostgreSQL `attendance_sessions` table as the sole source of truth.

### Problem: QR code graphic does not visually change
- **Cause**: Browser caching or missing component key binding.
- **Fix**: Verify backend returns a fresh UUID on every `/token` request and frontend `<QRCodeSVG key={qrToken} value={qrToken} />` uses `key={qrToken}` to force component re-renders.

### Problem: Email marked sent but recipient does not receive it
- **Cause**: SMTP authentication failure, spam filtering, or incorrect `MAIL_USER` / `MAIL_PASSWORD`.
- **Fix**: Inspect backend PM2 logs (`pm2 logs qff-backend`) to inspect the Nodemailer `accepted` and `rejected` arrays.

### Problem: Event dates appear incorrect
- **Cause**: Schema modified or incorrect seed data.
- **Fix**: Check `events` table dates using `SELECT event_id, event_date FROM events;`. Official dates must be `2026-09-07` through `2026-09-10`.

---

## 23. Rollback & Recovery Strategy

If a deployment fails:

1. **Do NOT Drop Database**: Never drop the production database as a troubleshooting step.
2. **Revert Code**: Revert code repository to previous stable commit (`git checkout <stable-commit-hash>`).
3. **Rebuild Frontend**: Run `npm run build --workspace frontend`.
4. **Restart Backend**: Run `pm2 restart qff-backend`.
5. **Database Restore**: If database restore is required, restore from daily backup using `pg_restore` or `psql -f backup.sql`.

---

## 24. Final Production Command Summary

```bash
# 1. Clone repository
git clone https://github.com/<owner>/<repository>.git Qiskit-Fall-Fest-2026
cd Qiskit-Fall-Fest-2026

# 2. Install workspace dependencies
npm ci

# 3. Apply database schema
cd database/schema
psql -h 127.0.0.1 -U qff_admin -d qff26 -f 00000000_run_all.sql
cd ../..

# 4. Seed database
node backend/src/seeds/seed_events.js

# 5. Run tests & build frontend
npm test --workspace backend
npm run build --workspace frontend

# 6. Start production backend with PM2
pm2 start backend/src/server.js --name "qff-backend"
pm2 save
```
