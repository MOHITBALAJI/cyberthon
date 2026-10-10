# AttendX — Multi-Layer Secure Attendance & Anti-Proxy Platform

> **Right Student. Right Place. Right Time.**

A cutting-edge cybersecurity platform demonstrating multi-vector authentication, dynamic rolling OTPs, rotating cryptographic QR tokens, and real-time fraud telemetry to eliminate proxy attendance and replay attacks.

**Repository:** [https://github.com/MOHITBALAJI/cyberthon.git](https://github.com/MOHITBALAJI/cyberthon.git)

---

## 💻 3-Laptop Live Demonstration Setup

| Node | Screen / URL | Role & Workflow |
| :--- | :--- | :--- |
| **Laptop 1: Server & Admin Sentinel** | `http://localhost:8080/admin`<br/>`http://localhost:8080/security` | Real-time security telemetry, Recharts fraud analysis, forensic event logging, and user management. |
| **Laptop 2: Teacher Session Manager** | `http://<HOST_IP>:8080/teacher` | Broadcasts 25-second HMAC-SHA256 rotating QR tokens and a live 6-digit rolling **Session Security OTP**. Displays live attendance via Supabase WebSockets. |
| **Laptop 3: Student Verification Client** | `http://<HOST_IP>:8080/student`<br/>`http://<HOST_IP>:8080/scan` | Enters 6-digit session OTP or scans QR code. Executes the **Tri-Vector Sentinel** check (Biometrics, IP Blanket, Geo-fence) and commits verified attendance. |

---

## 🛡️ Security Architecture & Algorithms

AttendX implements **8 verification layers** before accepting any attendance submission:

| Layer | Mechanism | Attack Prevented |
|-------|-----------|-----------------|
| 1 | HMAC-SHA256 signed QR token | Token forgery |
| 2 | Server-side expiry (25 seconds) | Shared/screenshot QR |
| 3 | Session status check | Closed session bypass |
| 4 | DB unique constraint | Duplicate attendance |
| 5 | Registered device policy | Unregistered device |
| 6 | One-time challenge-response | Replay attacks |
| 7 | In-room verification code (optional) | Remote attendance |
| 8 | Audit log + fraud detection | Pattern analysis |

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (SSR React) + TanStack Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Glassmorphism |
| Icons | Lucide React |
| Charts | Recharts |
| QR Display | qrcode (npm) |
| QR Scanner | html5-qrcode |
| Backend | TanStack Start server functions (SSR) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth |
| Token signing | Web Crypto API (HMAC-SHA256) |
| Device keys | Web Crypto API (ECDSA P-256) |

---

## 📁 Project Structure

```
construction-creator-hub/
├── src/
│   ├── routes/
│   │   ├── __root.tsx              # App shell, fonts, meta
│   │   ├── index.tsx               # Landing page
│   │   ├── auth.tsx                # Login / Register
│   │   └── _authenticated/
│   │       ├── route.tsx           # Auth guard
│   │       ├── student.tsx         # Student dashboard
│   │       ├── teacher.tsx         # Teacher dashboard + QR
│   │       ├── scan.tsx            # QR scanner + challenge
│   │       ├── security.tsx        # Security monitoring
│   │       └── admin.tsx           # Admin panel
│   ├── components/
│   │   └── app-shell.tsx           # Navigation + StatCard
│   ├── lib/
│   │   └── attendx.functions.ts    # All server functions
│   ├── integrations/
│   │   └── supabase/               # Supabase client + auth
│   └── styles.css                  # Tailwind + CSS variables
├── drizzle/
│   └── migrations/
│       └── 0000_attendx_schema.sql # Complete DB schema
├── .env                            # Local environment config
├── .env.example                    # Template for new setup
└── README.md
```

---

## 🗄️ Database Schema

The Supabase schema is in [`drizzle/migrations/0000_attendx_schema.sql`](drizzle/migrations/0000_attendx_schema.sql).

Key tables:
- **profiles** — User display names, registration numbers
- **user_roles** — Role assignments (admin/teacher/student)
- **devices** — Registered device public keys
- **subjects** — Course subjects assigned to teachers
- **attendance_sessions** — Session lifecycle (draft → active → closed)
- **qr_tokens** — Issued QR token registry (for server-side validation)
- **challenges** — One-time verification challenges
- **attendance** — Attendance records with unique(student, session) constraint
- **security_events** — Fraud detection audit log

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 20+
- A Supabase project (free tier works)

### 1. Clone and install

```bash
git clone <repo>
cd construction-creator-hub
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials and a strong QR_SIGNING_SECRET
```

### 3. Apply database schema

In your **Supabase Dashboard → SQL Editor**, run the migration:

```bash
# Copy contents of drizzle/migrations/0000_attendx_schema.sql
# Paste and run in Supabase SQL Editor
```

### 4. Start development server

```bash
npm run dev
# App runs at http://localhost:3000
```

---

## 🎭 Demo Mode (Hackathon)

On the **Sign In** page, click **"Load demo"** to seed:
- 1 Admin account
- 1 Teacher account (Dr. Priya Sharma)
- 5 Student accounts (Aarav, Diya, Rohan, Sneha, Karan)
- 3 Subjects (Cyber Security, Network Security, Cryptography)
- Historical attendance data (4 days × 3 subjects, ~80% rate)
- Sample security events (expired QR, duplicate, forgery, replay)

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@attendx.demo | Demo1234! |
| Teacher | teacher@attendx.demo | Demo1234! |
| Student | student1@attendx.demo | Demo1234! |
| Student | student2@attendx.demo | Demo1234! |
| Student | student3@attendx.demo | Demo1234! |

> **Note:** The Supabase project must have "email confirmation" disabled for demo seeding to work without inbox access. Disable it in Authentication → Providers → Email.

---

## 🧪 Demonstration Scenarios

### Scenario A: Legitimate Attendance
1. Sign in as **teacher@attendx.demo**
2. Go to **Sessions** → Create session → Start
3. Note the rotating QR code (refreshes every 25s)
4. In another browser: sign in as **student1@attendx.demo**
5. Go to **Scan** → scan the QR (or paste the token manually)
6. Complete the symbol-sequence challenge
7. Enter room code if required
8. ✅ **ATTENDANCE VERIFIED** appears on both dashboards

### Scenario B: Expired QR Token
1. Copy a QR token from the teacher dashboard
2. Wait 30+ seconds for it to expire
3. Submit it manually on the scan page
4. ⛔ **ACCESS DENIED — QR TOKEN EXPIRED**

### Scenario C: Duplicate Attendance
1. Complete attendance successfully
2. Scan the QR again on the same session
3. 🔁 **REQUEST BLOCKED — DUPLICATE ATTENDANCE**

### Scenario D: Replayed Challenge
1. Complete a verification challenge successfully
2. Submit the same challengeId and answer again via the scan page
3. 🔄 **REQUEST BLOCKED — CHALLENGE ALREADY USED**

### Scenario E: Suspicious Activity
1. Generate several invalid requests (wrong token, wrong room code)
2. Open **Security Dashboard** (teacher/admin)
3. ⚠️ **SUSPICIOUS ACTIVITY DETECTED — REVIEW REQUIRED**
4. Review or dismiss each event

---

## 🔒 Security Notes

- **Server-side time only**: QR expiry is checked using `Date.now()` on the server. The client clock is never trusted.
- **HMAC-SHA256 signing**: QR tokens are signed with a secret known only to the server. Students cannot generate valid tokens.
- **Atomic challenge use**: Challenges are marked `used_at` before the answer is checked, preventing TOCTOU races.
- **DB constraint**: `UNIQUE(student_id, session_id)` on the attendance table prevents duplicates even under concurrent requests.
- **RLS policies**: Supabase Row Level Security ensures students can only read their own data.

### Limitations (deliberately not claimed)
- IP addresses and browser geolocation do **not** prove physical presence.
- Device fingerprints are not relied upon as proof of identity.
- Challenge-response reduces replay attacks but doesn't guarantee a student is physically in the room.
- All ambiguous cases are labeled "suspicious — requires teacher review", never as definitive proof of cheating.

---

## 📊 Security Dashboard Features

- Real-time stats: students, active sessions, present count, rejected attempts
- Recharts visualizations: attendance by subject, event trends, severity distribution, accepted vs rejected
- Security events table with severity badges and review/dismiss actions
- Fraud detection labels with explanations for every event type

---

## 🏗️ Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| TanStack Start (SSR) | Server functions run server-side without exposing secrets to client |
| Supabase RLS | Defense-in-depth: even if app logic has bugs, DB policies enforce access |
| Server-only QR signing | No shared secret in the browser |
| Web Crypto (non-exportable) | Device private keys cannot be extracted from the browser |
| Atomic challenge marking | Prevents replay under concurrent requests |
| Explanation on every event | Transparency: never a black-box accusation |

---

*Built as a cybersecurity hackathon prototype. Not production-hardened without additional security review.*
