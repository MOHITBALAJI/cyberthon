import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  QrCode,
  KeyRound,
  Smartphone,
  Radar,
  ArrowRight,
  Lock,
  Zap,
  Eye,
  Database,
  Code2,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  Cpu,
  Fingerprint,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AttendX — Multi-Layer Secure Attendance & Anti-Proxy Platform" },
      {
        name: "description",
        content:
          "Right Student. Right Place. Right Time. Rotating QR codes, one-time challenges and device verification that stop proxy attendance.",
      },
      { property: "og:title", content: "AttendX — Secure Attendance & Anti-Proxy Platform" },
      {
        property: "og:description",
        content: "Multi-layer attendance verification: rotating signed QR tokens, challenge-response, and registered devices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: QrCode,
    title: "Rotating Dynamic QR",
    desc: "Cryptographically signed QR tokens generated with HMAC-SHA256 that rotate every 25 seconds. Screenshots and shared codes expire before they can be forwarded.",
    badge: "HMAC-SHA256",
    gradient: "from-sky-500/20 to-blue-500/5",
  },
  {
    icon: KeyRound,
    title: "Challenge-Response Gate",
    desc: "Every scan unlocks a single-use interactive sequence verification. Replays and intercepted requests are rejected at the server level.",
    badge: "45s TTL Single-Use",
    gradient: "from-purple-500/20 to-indigo-500/5",
  },
  {
    icon: Fingerprint,
    title: "Device Cryptographic Binding",
    desc: "Browser-generated ECDSA P-256 public-private keys using Web Crypto API. Identifies unregistered and unauthorized hardware attempts.",
    badge: "Web Crypto API",
    gradient: "from-emerald-500/20 to-teal-500/5",
  },
  {
    icon: Radar,
    title: "Real-Time Fraud Engine",
    desc: "Rule-based heuristic detector instantly flagging replay attempts, expired tokens, duplicate submissions, and unexpected bursts.",
    badge: "Heuristic Sentinel",
    gradient: "from-rose-500/20 to-orange-500/5",
  },
  {
    icon: Lock,
    title: "Zero-Trust Authorization",
    desc: "Strict server-side role validation powered by Supabase Row-Level Security (RLS). Frontend restrictions are backed by database policies.",
    badge: "PostgreSQL RLS",
    gradient: "from-amber-500/20 to-yellow-500/5",
  },
  {
    icon: Eye,
    title: "Forensic Audit Logging",
    desc: "Immutable logs recording decision trails, timestamp discrepancies, and student identifiers for professor and administrator inspection.",
    badge: "Immutable Trail",
    gradient: "from-cyan-500/20 to-blue-500/5",
  },
];

const securityLayers = [
  { step: "01", label: "HMAC QR Signature", detail: "SHA-256 token integrity", icon: Shield },
  { step: "02", label: "Server-Clock Expiry", detail: "25-second rotation window", icon: Cpu },
  { step: "03", label: "Live Session Check", detail: "Teacher lifecycle validation", icon: Layers },
  { step: "04", label: "Duplicate Guard", detail: "Database unique constraints", icon: Lock },
  { step: "05", label: "Device Binding", detail: "Web Crypto public key verify", icon: Smartphone },
  { step: "06", label: "Challenge Gate", detail: "One-time symbol puzzle", icon: KeyRound },
  { step: "07", label: "In-Room Code", detail: "Physical room verification", icon: Zap },
  { step: "08", label: "Audit & Sentinel", detail: "Heuristic threat evaluation", icon: Radar },
];

const techStack = [
  { icon: Code2, label: "TanStack Start", sub: "Full-Stack SSR React 19" },
  { icon: Database, label: "Supabase PostgreSQL", sub: "Enterprise RLS & Auth" },
  { icon: Shield, label: "Web Crypto API", sub: "ECDSA Device Keys" },
  { icon: Zap, label: "HMAC-SHA256", sub: "Sub-Second QR Signing" },
];

const demoAccounts = [
  { role: "Teacher", email: "teacher@attendx.demo", desc: "Start sessions, broadcast live rotating QR", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { role: "Student 1", email: "student1@attendx.demo", desc: "Scan QR, solve challenge, bind hardware", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { role: "Admin", email: "admin@attendx.demo", desc: "System audit logs, user management, metrics", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
];

function Landing() {
  return (
    <div className="min-h-screen cyber-grid relative overflow-hidden">
      {/* Background radial ambiance lights */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-sky-500/15 via-purple-500/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[65%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[130px] pointer-events-none" />

      {/* Floating Modern Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500/25 via-accent/20 to-transparent border border-primary/40 shadow-lg shadow-sky-500/15">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">AttendX</span>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono-x uppercase font-semibold text-primary">
                  v2.0 Elite
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:text-white hover:bg-secondary/60 border border-transparent hover:border-border"
            >
              Sign In
            </Link>
            <Link
              to="/auth"
              search={{ redirect: undefined }}
              className="glow-primary rounded-xl bg-gradient-to-r from-sky-500 to-primary px-5 py-2.5 text-xs font-bold text-slate-950 transition-all hover:scale-105 shadow-md shadow-sky-500/25"
            >
              Launch Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-20 text-center">
        <div className="mx-auto mb-8 inline-flex items-center gap-2.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-medium text-sky-300 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          Next-Gen Anti-Proxy Attendance Protocol
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-[1.08]">
          <span className="text-gradient-cyber">Right Student.</span>
          <br />
          <span className="text-white">Right Place. Right Time.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base sm:text-lg text-slate-300/90 leading-relaxed font-normal">
          Defeating proxy attendance and relay fraud through cryptographic dynamic QR codes, hardware device binding, single-use challenges, and real-time sentinel telemetry.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/auth"
            className="glow-primary flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-primary to-cyan-400 px-8 py-4 font-bold text-slate-950 text-sm transition-all hover:scale-105 shadow-lg shadow-sky-500/25"
          >
            Open Interactive Demo <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#architecture"
            className="flex items-center gap-2 rounded-2xl border border-border/80 bg-secondary/60 backdrop-blur-md px-8 py-4 font-semibold text-slate-200 text-sm transition-all hover:bg-secondary hover:border-slate-500/50"
          >
            Explore 8 Security Layers
          </a>
        </div>

        {/* Live Metrics Floating Bar */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 sm:gap-6">
          {[
            ["8 Gates", "Multi-Layer Verification"],
            ["25s", "Cryptographic Rotation"],
            ["0%", "Replay Vulnerability"],
          ].map(([val, desc]) => (
            <div key={desc} className="glass p-5 rounded-2xl border border-white/10 hover:border-primary/40 transition-all shadow-xl">
              <p className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300 font-mono-x">
                {val}
              </p>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-400 font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Architecture - 8 Gates */}
      <section id="architecture" className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono-x font-bold tracking-widest text-primary uppercase">Defense In Depth</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">8-Layer Zero-Trust Verification Pipeline</h2>
          <p className="mt-3 text-sm text-slate-400">
            Every attendance attempt must sequentially validate through all gates. A failure at any gate aborts the transaction and logs forensic evidence.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {securityLayers.map((l) => (
            <div
              key={l.step}
              className="glass-interactive p-5 flex flex-col justify-between group rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono-x text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                  GATE {l.step}
                </span>
                <l.icon className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-6">
                <p className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">{l.label}</p>
                <p className="mt-1 text-[11px] text-slate-400 font-mono-x">{l.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono-x font-bold tracking-widest text-accent uppercase">Enterprise Features</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">Engineered For Zero Proxies</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className={`glass-interactive p-6 flex flex-col justify-between group rounded-2xl bg-gradient-to-b ${f.gradient}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-background/60 border border-white/10 group-hover:border-primary/50 transition-all">
                    <f.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-mono-x text-slate-300">
                    {f.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-white group-hover:text-sky-300 transition-colors">{f.title}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-primary">
                <span>Active Protection</span>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Credentials Box */}
      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="glass p-8 sm:p-12 rounded-3xl border border-primary/20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 mb-4">
                <Sparkles className="h-3.5 w-3.5" /> Ready-To-Test Hackathon Accounts
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Experience All Roles Instantly</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Log into any role to see the teacher rotating QR broadcaster, the student camera scanner and challenge solver, or the security audit dashboard.
              </p>

              <div className="mt-6 space-y-2.5">
                {demoAccounts.map((a) => (
                  <div key={a.email} className={`flex items-center justify-between p-3.5 rounded-xl border ${a.color} transition-all`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider">{a.role}</span>
                        <span className="font-mono-x text-xs text-slate-300">{a.email}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{a.desc}</p>
                    </div>
                    <span className="font-mono-x text-[11px] px-2 py-0.5 rounded bg-black/40 text-slate-300">Demo1234!</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  to="/auth"
                  className="glow-primary rounded-xl bg-gradient-to-r from-sky-500 to-primary px-6 py-3 text-xs font-bold text-slate-950 transition-all hover:scale-105"
                >
                  Log In Now
                </Link>
                <span className="text-xs text-slate-400">Default password for all accounts: <strong className="text-white font-mono-x">Demo1234!</strong></span>
              </div>
            </div>

            {/* Attack Scenario Checklist */}
            <div className="glass p-6 sm:p-8 rounded-2xl border border-white/10 bg-secondary/30">
              <h3 className="text-sm font-mono-x uppercase tracking-wider font-bold text-white mb-4">Anti-Proxy Demonstration Scenarios</h3>
              <div className="space-y-3">
                {[
                  { tag: "SCENARIO A", title: "Legitimate Attendance", desc: "Teacher starts QR, student solves 4-symbol sequence", status: "VERIFIED" },
                  { tag: "SCENARIO B", title: "Expired QR Forwarding", desc: "Screenshot shared after 25s rotation threshold", status: "BLOCKED: EXPIRED" },
                  { tag: "SCENARIO C", title: "Duplicate Proxy", desc: "Submitting attendance twice in the same session", status: "BLOCKED: DUPLICATE" },
                  { tag: "SCENARIO D", title: "Replay Attack", desc: "Reusing intercepted challenge response token", status: "BLOCKED: REPLAY" },
                  { tag: "SCENARIO E", title: "Unknown Hardware", desc: "Attempt from unregistered device or mismatch", status: "FLAGGED AUDIT" },
                ].map((s) => (
                  <div key={s.tag} className="p-3 rounded-xl bg-background/50 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-x text-[10px] text-sky-400 font-semibold">{s.tag}</span>
                        <span className="font-bold text-slate-200">{s.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                    </div>
                    <span className="font-mono-x text-[10px] font-bold px-2 py-1 rounded bg-secondary text-primary border border-primary/20">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="border-t border-border/80 bg-background/90 py-12 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-bold text-white text-sm">AttendX</span>
            <span className="text-[11px] text-muted-foreground">· Anti-Proxy Digital Attendance Platform</span>
          </div>
          <p className="font-mono-x text-[11px]">Right Student · Right Place · Right Time</p>
        </div>
      </footer>
    </div>
  );
}
