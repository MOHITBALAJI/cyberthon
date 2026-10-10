import { Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, LogOut, LayoutDashboard, QrCode, Radar, Users, ScanLine } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/attendx.functions";

export function useProfile() {
  const [data, setData] = useState<{ profile: any; role: string } | null>(null);
  useEffect(() => {
    getMyProfile().then(setData).catch(() => setData(null));
  }, []);
  return data;
}

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const me = useProfile();
  const role = me?.role ?? "student";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, show: role === "student" },
    { to: "/scan", label: "Scan", icon: ScanLine, show: role === "student" },
    { to: "/teacher", label: "Sessions", icon: QrCode, show: role === "teacher" || role === "admin" },
    { to: "/security", label: "Security", icon: Radar, show: role !== "student" },
    { to: "/admin", label: "Admin", icon: Users, show: role === "admin" },
  ].filter((n) => n.show);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold">AttendX</span>
            <span className="hidden rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">{role}</span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
              >
                <n.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{n.label}</span>
              </Link>
            ))}
            <button onClick={signOut} className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "primary" }: { label: string; value: string | number; icon: any; tone?: "primary" | "success" | "destructive" | "warning" | "accent" }) {
  const tones: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    destructive: "text-destructive bg-destructive/10",
    warning: "text-warning bg-warning/10",
    accent: "text-accent bg-accent/10",
  };
  return (
    <div className="glass p-5">
      <div className={`inline-flex rounded-lg p-2 ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
