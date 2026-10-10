import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, QrCode, KeyRound, Smartphone, Radar, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AttendX — Multi-Layer Secure Attendance & Anti-Proxy Platform" },
      { name: "description", content: "Right Student. Right Place. Right Time. Rotating QR codes, one-time challenges and device verification that stop proxy attendance." },
      { property: "og:title", content: "AttendX — Secure Attendance & Anti-Proxy Platform" },
      { property: "og:description", content: "Multi-layer attendance verification: rotating signed QR tokens, challenge-response, and registered devices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: QrCode, title: "Rotating QR Tokens", desc: "Cryptographically signed QR codes rotate every 25 seconds. Screenshots and shares expire before they can be abused." },
  { icon: KeyRound, title: "One-Time Challenges", desc: "Every scan triggers a single-use challenge-response check. Replayed requests are rejected and logged." },
  { icon: Smartphone, title: "Registered Devices", desc: "Students verify from registered devices only. Unexpected device changes are flagged for review." },
  { icon: Radar, title: "Fraud Detection Engine", desc: "Rule-based detection flags expired tokens, duplicates, replays and suspicious bursts — with explanations." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight">AttendX</span>
        </div>
        <div className="flex gap-3">
          <Link to="/auth" className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link to="/auth" search={{ redirect: undefined }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105">
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Multi-layer verification engine online
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
          <span className="text-gradient">Right Student.</span> Right Place. Right Time.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          AttendX stops proxy attendance with rotating signed QR tokens, one-time challenge-response
          verification, and registered-device checks — all monitored from a live security dashboard.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link to="/auth" className="glow-primary flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105">
            Launch the demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="glass group p-6 transition-all hover:border-primary/50">
              <f.icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["1", "Teacher starts a session", "A signed QR token is generated and rotated every 25 seconds on the classroom screen."],
            ["2", "Student scans & verifies", "The backend validates the token, then issues a one-time challenge the student must solve."],
            ["3", "Attendance is recorded", "Only after every check passes. Duplicates, replays and forgeries are blocked and logged."],
          ].map(([n, t, d]) => (
            <div key={n} className="glass p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-mono-x text-lg font-bold text-primary">{n}</div>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
          Note: challenge-response verification strongly reduces replay and proxy attacks, but no
          digital system alone can prove physical presence. AttendX labels uncertain cases as
          "requires teacher review" rather than accusing students.
        </p>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        AttendX — Multi-Layer Secure Attendance & Anti-Proxy Platform
      </footer>
    </div>
  );
}
