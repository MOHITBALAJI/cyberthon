import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Loader2, Sparkles, Key, UserCheck, Lock, Mail, ArrowRight, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { seedDemoData } from "@/lib/attendx.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || undefined }),
  head: () => ({
    meta: [
      { title: "Authentication — AttendX" },
      { name: "description", content: "Sign in or create your AttendX account." },
      { property: "og:title", content: "Sign in — AttendX" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [seedBusy, setSeedBusy] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, reg_no: regNo, role } },
        });
        if (error) throw error;
        setMsg({ kind: "ok", text: "Account created! Now signing you in..." });
        
        // Auto sign-in immediately after registration
        const { data: signData, error: inErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!inErr && signData?.user) {
          const userRole = role;
          const target = userRole === "teacher" ? "/teacher" : userRole === "admin" ? "/admin" : "/student";
          navigate({ to: target });
          return;
        }
        setMode("login");
      } else {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // If credentials fail, try to register the account on the fly (for pre-configured buttons)
          if (error.message.includes("Invalid login credentials") || error.code === "invalid_credentials") {
            const role = email.includes("teacher") ? "teacher" : email.includes("bitsathy") ? "admin" : "student";
            const fullName = email.includes("teacher") ? "Mohit Balaji (Faculty)" : email.includes("bitsathy") ? "Mohit Balaji (Admin)" : "Mohit Balaji (Student)";
            
            const { error: upErr } = await supabase.auth.signUp({
              email,
              password,
              options: { data: { full_name: fullName, role, reg_no: "EC23001" } }
            });
            
            if (!upErr) {
              const { data: retryData, error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
              if (!retryErr && retryData?.user) {
                const target = role === "teacher" ? "/teacher" : role === "admin" ? "/admin" : "/student";
                navigate({ to: target });
                return;
              }
            }
          }
          throw error;
        }
        
        let target = redirect;
        if (!target && user) {
          const { data: roleRow } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();
          
          const userRole = roleRow?.role || user.user_metadata?.role || (email.includes("teacher") ? "teacher" : email.includes("bitsathy") ? "admin" : "student");
          if (userRole === "teacher") target = "/teacher";
          else if (userRole === "admin") target = "/admin";
          else target = "/student";
        }
        
        navigate({ to: target || "/student" });
      }
    } catch (err: any) {
      setMsg({ kind: "error", text: err.message ?? "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("Demo1234!");
    setMode("login");
  }

  async function seed() {
    setSeedBusy(true);
    setSeedMsg(null);
    try {
      const res = await seedDemoData();
      setSeedMsg(
        res.ok
          ? "Demo database populated! Use the demo account buttons below."
          : res.error ?? "Demo data ready — click any demo account below.",
      );
    } catch (err: any) {
      setSeedMsg(err.message ?? "Seeding failed");
    } finally {
      setSeedBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 cyber-grid relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3 group">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500/20 via-accent/15 to-transparent border border-primary/30 group-hover:border-primary/60 transition-all shadow-lg group-hover:shadow-primary/20">
            <ShieldCheck className="h-6 w-6 text-primary transition-transform group-hover:scale-105" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white">AttendX</span>
            <span className="block text-[10px] text-sky-400 font-mono-x">SECURE GATEWAY</span>
          </div>
        </Link>

        {/* Card */}
        <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-secondary/80 p-1 border border-border/60">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg py-2.5 text-xs font-bold transition-all ${
                  mode === m
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-[11px] font-mono-x text-slate-400 block mb-1">FULL NAME</label>
                  <input
                    className="w-full rounded-xl border border-border/80 bg-background/70 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="e.g. Dr. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono-x text-slate-400 block mb-1">REGISTRATION NUMBER (OPTIONAL)</label>
                  <input
                    className="w-full rounded-xl border border-border/80 bg-background/70 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="e.g. CS202610"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono-x text-slate-400 block mb-1">ACCOUNT TYPE</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["student", "teacher"] as const).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`rounded-xl border py-2 text-xs font-semibold capitalize transition-all ${
                          role === r
                            ? "border-primary bg-primary/15 text-primary shadow-sm"
                            : "border-border/80 bg-secondary/40 text-slate-400 hover:text-white"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-[11px] font-mono-x text-slate-400 block mb-1">EMAIL ADDRESS</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-border/80 bg-background/70 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono-x"
                  type="email"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono-x text-slate-400 block mb-1">PASSWORD</label>
              <input
                className="w-full rounded-xl border border-border/80 bg-background/70 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono-x"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {msg && (
              <p
                className={`rounded-xl px-3.5 py-2.5 text-xs font-medium border ${
                  msg.kind === "error"
                    ? "bg-destructive/10 border-destructive/30 text-rose-300"
                    : "bg-success/10 border-success/30 text-emerald-300"
                }`}
              >
                {msg.text}
              </p>
            )}

            <button
              disabled={busy}
              className="glow-primary flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-primary py-3 text-xs font-bold text-slate-950 transition-all hover:scale-[1.02] disabled:opacity-60 shadow-lg shadow-sky-500/20"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {mode === "login" ? "Authenticate Session" : "Create Secure Account"}
            </button>
          </form>
        </div>

        {/* Demo Fast-Login Box */}
        <div className="glass mt-5 p-5 rounded-3xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <p className="text-xs font-bold text-white uppercase tracking-wider font-mono-x">1-Click Demo Login</p>
            </div>
            <button
              onClick={seed}
              disabled={seedBusy}
              className="text-[10px] font-mono-x text-purple-400 hover:text-purple-300 underline"
            >
              {seedBusy ? "Seeding..." : "Seed Database"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Teacher", email: "teacher.mohit@attendx.com", pass: "Password123!", color: "hover:border-sky-500/50 hover:bg-sky-500/10 text-sky-400" },
              { label: "Student 1", email: "mohitbalaji77@gmail.com", pass: "12345678", color: "hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400" },
              { label: "Admin", email: "mohitbalaji.ec23@bitsathy.ac.in", pass: "12345678", color: "hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-400" },
            ].map((btn) => (
              <button
                key={btn.email}
                type="button"
                onClick={() => {
                  setEmail(btn.email);
                  setPassword(btn.pass);
                  setMode("login");
                }}
                className={`p-2.5 rounded-xl border border-border/80 bg-secondary/50 text-[11px] font-bold transition-all text-center ${btn.color}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {seedMsg && <p className="mt-3 text-[11px] text-slate-400 font-mono-x bg-black/40 p-2 rounded-lg">{seedMsg}</p>}
        </div>
      </div>
    </div>
  );
}
