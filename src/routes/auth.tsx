import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { seedDemoData } from "@/lib/attendx.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — AttendX" },
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
        setMsg({ kind: "ok", text: "Account created. If email confirmation is required, check your inbox — otherwise sign in." });
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: redirect ?? "/student" });
      }
    } catch (err: any) {
      setMsg({ kind: "error", text: err.message ?? "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  async function seed() {
    setSeedBusy(true);
    setSeedMsg(null);
    try {
      const res = await seedDemoData();
      setSeedMsg(
        res.ok
          ? "Demo data loaded. Sign in as teacher@attendx.demo or student1@attendx.demo (password Demo1234!)."
          : res.error ?? "Demo data already loaded — use the demo accounts below.",
      );
    } catch (err: any) {
      setSeedMsg(err.message ?? "Seeding failed");
    } finally {
      setSeedBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">AttendX</span>
        </Link>

        <div className="glass p-8">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-secondary/60 p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <>
                <input className="w-full rounded-lg border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input className="w-full rounded-lg border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Registration number (students)" value={regNo} onChange={(e) => setRegNo(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  {(["student", "teacher"] as const).map((r) => (
                    <button type="button" key={r} onClick={() => setRole(r)} className={`rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${role === r ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </>
            )}
            <input className="w-full rounded-lg border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary" type="email" placeholder="College email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="w-full rounded-lg border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            {msg && (
              <p className={`rounded-lg px-3 py-2 text-sm ${msg.kind === "error" ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>{msg.text}</p>
            )}
            <button disabled={busy} className="glow-primary flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <div className="glass mt-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Hackathon demo mode</p>
              <p className="text-xs text-muted-foreground">Loads demo teacher, admin, 5 students, subjects & history.</p>
            </div>
            <button onClick={seed} disabled={seedBusy} className="flex items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-60">
              {seedBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Load demo
            </button>
          </div>
          {seedMsg && <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">{seedMsg}</p>}
          <p className="mt-3 font-mono-x text-[11px] leading-relaxed text-muted-foreground">
            teacher@attendx.demo · student1@attendx.demo · admin@attendx.demo — password: Demo1234!
          </p>
        </div>
      </div>
    </div>
  );
}
