# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## AttendX: Multi-Layer Secure Attendance & Anti-Proxy Platform

**Document Version:** 1.0.0  
**Project Name:** AttendX  
**Prepared By:** Mohit Balaji & Engineering Team  
**Date:** October 2026  
**Repository:** [https://github.com/MOHITBALAJI/cyberthon.git](https://github.com/MOHITBALAJI/cyberthon.git)

---

## 1. INTRODUCTION

### 1.1 Purpose
This document specifies the software requirements for **AttendX**, a zero-trust, multi-layer secure digital attendance and anti-proxy verification platform. It provides a formal description of system features, cryptographic algorithms, non-functional constraints, and interface specifications for developers, project evaluators, and system auditors.

### 1.2 Scope
Traditional attendance mechanisms (paper rosters, static barcodes, and fingerprint terminals) suffer from severe security flaws including proxy signing, photographic credential sharing, buddy-punching, and physical bottlenecks. AttendX resolves these vulnerabilities using an 8-layer verification framework:
- Dynamic 25-second rotating HMAC-SHA256 QR tokens.
- Rolling 6-digit session security room OTPs.
- Tri-Vector Sentinel verification (Biometric WebAuthn/WebCrypto + Campus IP Blanket + Geolocation Fence).
- Real-time WebSocket replication for instantaneous teacher roster updates.
- Centralized Forensic Audit Sentinel monitoring for replay and tampering attacks.

### 1.3 Definitions, Acronyms, and Abbreviations
- **HMAC:** Hash-Based Message Authentication Code.
- **SHA-256:** Secure Hash Algorithm 256-bit.
- **OTP:** One-Time Password / Room Code.
- **RLS:** Row Level Security (PostgreSQL).
- **TTL:** Time To Live (validity lifetime).
- **RPC:** Remote Procedure Call.
- **WebAuthn:** Web Authentication standard for hardware-backed biometrics.
- **Haversine Formula:** Spherical trigonometry equation calculating great-circle distance between two GPS coordinates.

---

## 2. OVERALL SYSTEM DESCRIPTION

### 2.1 Product Perspective
AttendX operates as a distributed web application deployed across heterogeneous client devices:
- **Server / Admin Node:** Hosts the application server, PostgreSQL relational store, and real-time WebSocket broker.
- **Teacher Node (Presenter):** Generates active classroom sessions, displays rotating QR codes, and presents dynamic 6-digit room codes.
- **Student Node (Scanner / Submitter):** Captures tokens, satisfies biometric, IP, and GPS constraints, and submits attendance.

### 2.2 System Architecture Diagram
```
+-------------------------------------------------------------------------------+
|                             CLIENT TIER (REACT 19)                            |
|  +---------------------+   +---------------------+   +---------------------+  |
|  |   Admin Sentinel    |   |   Teacher Console   |   |   Student Client    |  |
|  |  (/admin, /security)|   |      (/teacher)     |   |  (/student, /scan)  |  |
|  +----------+----------+   +----------+----------+   +----------+----------+  |
+-------------|-------------------------|-------------------------|-------------+
              |                         |                         |
              | RPC / WebSockets        | RPC / WebSockets        | REST / RPC
              v                         v                         v
+-------------------------------------------------------------------------------+
|                      APPLICATION & SECURITY ENGINE TIER                       |
|  - TanStack Start Server Functions & Type-Safe RPCs                           |
|  - HMAC-SHA256 Token Digital Signer (25-second cycle)                         |
|  - Rolling 6-Digit Room Code Generator                                        |
|  - Tri-Vector Sentinel Pipeline (Biometric, Subnet Blanket, Geo-fence)        |
|  - Anti-Replay Nonce Engine & Challenge-Response Validator                    |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                            DATA PERSISTENCE TIER                              |
|  - PostgreSQL with Supabase RLS (Profiles, Sessions, Tokens, Attendance)      |
|  - Realtime WebSocket Channels (PostgreSQL WAL streaming)                     |
|  - Append-Only Forensic Security Event Log                                    |
+-------------------------------------------------------------------------------+
```

### 2.3 User Classes & Characteristics
1. **System Administrator:** Oversees academic subjects, audits security logs, inspects flagged proxy attempts, and manages platform health.
2. **Teacher / Faculty Member:** Creates attendance sessions, sets security parameters (device lock, room code requirement), monitors live roster updates, and exports attendance CSVs.
3. **Student:** Enrolls registered devices, enters classroom session OTPs or scans rotating QR codes, passes biometric & geo-checks, and tracks attendance percentages.

---

## 3. SPECIFIC FUNCTIONAL REQUIREMENTS

### 3.1 Teacher Session Management
- **FR-T01: Subject Creation:** Teachers shall have permission to define subjects specifying Name, Subject Code, and Department.
- **FR-T02: Session Initiation:** Teachers shall create attendance sessions with configurable durations (e.g., 60 minutes) and security toggles (`require_device`, `require_room_code`).
- **FR-T03: Rotating QR Generation:** Active sessions shall issue an HMAC-SHA256 signed QR token that auto-refreshes every 25 seconds.
- **FR-T04: Rolling In-Room OTP:** Active sessions shall generate and display a randomized 6-digit OTP synchronized with the 25-second countdown timer.
- **FR-T05: Real-Time Roster:** The teacher interface shall subscribe to PostgreSQL changes and display student names and registration numbers in sub-second latency upon verification.
- **FR-T06: Session Termination & Export:** Teachers shall be able to terminate active sessions and immediately export an audit-compliant CSV report.

### 3.2 Student Verification & Attendance Submission
- **FR-S01: Direct OTP Submission:** Students shall be able to submit the 6-digit rolling OTP directly from their dashboard.
- **FR-S02: Camera QR Capture:** Students shall be able to scan the rotating QR code using the browser camera feed.
- **FR-S03: One-Time Challenge Response:** When scanning QR codes, students must solve a randomized 4-symbol ordered sequence (`▲`, `●`, `■`, `◆`, `★`, `⬢`) within 45 seconds to defeat automated bot replay.
- **FR-S04: Biometric Shield:** The client shall invoke WebAuthn / Web Crypto API to ensure the submission originates from a verified hardware credential.
- **FR-S05: IP Blanket Verification:** The server shall inspect client IP headers against campus subnet whitelists to ensure on-premise execution.
- **FR-S06: Geo-Fence Distance Check:** The server shall compute the Haversine distance from the classroom coordinates to the client GPS coordinate. Distances exceeding 50 meters shall be rejected.
- **FR-S07: Duplicate Attendance Prevention:** The database shall enforce a composite unique constraint `(session_id, student_id)` to block multi-submission proxies.

### 3.3 Security Sentinel & Administration
- **FR-A01: Real-Time Telemetry:** The Admin/Security dashboard shall render charts illustrating:
  - Total Verified vs. Rejected attempts per session.
  - Event distribution by severity (`low`, `medium`, `high`, `critical`).
  - Attendance rates categorized by subject.
- **FR-A02: Forensic Event Logging:** All failed or anomalous attempts (expired token, duplicate entry, invalid signature, replay attempt) shall be permanently recorded with timestamp, user ID, session ID, and explanatory classification.
- **FR-A03: Event Resolution:** Faculty/Admins shall have the authority to review or dismiss flagged anomaly events.

---

## 4. MATHEMATICAL & ALGORITHMIC SPECIFICATIONS

### 4.1 Cryptographic QR Token Generation
The server generates an unforgeable digital token:
$$\text{Payload} = \text{SessionID} \parallel \text{UUID} \parallel (\text{Timestamp}_{\text{now}} + 25000\text{ms})$$
$$\text{Signature} = \text{HMAC-SHA256}(K_{\text{server}}, \text{Payload})$$
$$\text{Token} = \text{Base64Url}(\text{Payload}) \parallel "." \parallel \text{Hex}(\text{Signature})$$

### 4.2 Geo-Fence Haversine Formula
Given student coordinates $(\phi_1, \lambda_1)$ and classroom coordinates $(\phi_2, \lambda_2)$:
$$\Delta \phi = \phi_2 - \phi_1, \quad \Delta \lambda = \lambda_2 - \lambda_1$$
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d = R \cdot c \quad (R = 6371000\text{ meters})$$
$$\text{Validation Condition:} \quad d \le 50.0\text{ meters}$$

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance Requirements
- **NFR-P01:** WebSocket attendance propagation delay must be under 300 ms across local Wi-Fi networks.
- **NFR-P02:** Token verification RPC must execute in under 150 ms under concurrent classroom loads (100 students).

### 5.2 Security Requirements
- **NFR-S01:** The secret key `QR_SIGNING_SECRET` shall reside strictly in server environment variables and never be sent to client runtimes.
- **NFR-S02:** Client clocks must not be trusted; all token expirations are evaluated against server timestamp `Date.now()`.
- **NFR-S03:** Database tables must be guarded by PostgreSQL Row Level Security (RLS) ensuring students cannot read or tamper with peer attendance records.

### 5.3 Reliability & Availability
- **NFR-R01:** The system shall gracefully handle offline network spikes by displaying precise, non-blocking toast notifications.
- **NFR-R02:** The dev/production server shall expose standardized HTTP health status endpoints returning code 200.

---

## 6. HARDWARE & SOFTWARE SPECIFICATIONS

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Processor** | Dual-Core 2.0 GHz | Quad-Core 2.8 GHz or higher |
| **RAM** | 4 GB | 8 GB or higher |
| **Network** | Shared 2.4 GHz / 5 GHz Wi-Fi | Low-latency 5 GHz Campus WLAN |
| **Client Browsers** | Chrome 110+, Edge 110+, Safari 16+ | Latest Chrome or Edge with Camera & GPS enabled |
| **Server Runtime** | Node.js v20.x, Vite v8.x | Node.js LTS v20.12+ |
| **Database** | PostgreSQL v15+ (Supabase) | Managed Supabase Cloud / On-Premise Postgres |

---

## 7. VERIFICATION & ACCEPTANCE MATRIX

| Test ID | Test Scenario | Expected Outcome | Verification Status |
| :--- | :--- | :--- | :--- |
| **TC-01** | Student submits active 6-digit rolling OTP within 25 seconds. | Attendance marked as `verified`; student roster updates on teacher laptop. | **PASS** |
| **TC-02** | Student submits 6-digit OTP after 25-second expiration. | Attendance blocked with `qr_expired`; security event logged. | **PASS** |
| **TC-03** | Student attempts submitting attendance twice for same session. | Blocked by PostgreSQL unique constraint; flagged as duplicate attempt. | **PASS** |
| **TC-04** | Student attempts GPS spoofing beyond 50-meter classroom radius. | Tri-Vector Sentinel rejects submission; logged as geo-fence breach. | **PASS** |
| **TC-05** | Real-time WebSocket transmission to Teacher & Admin dashboards. | Live update renders in `< 250 ms` without browser refresh. | **PASS** |

---
*End of Specification Document — AttendX Hackathon Edition*
