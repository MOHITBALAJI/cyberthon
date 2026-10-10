import { Link, useNavigate } from "@tanstack/react-router";
import { 
  ShieldCheck, 
  LogOut, 
  LayoutDashboard, 
  QrCode, 
  Radar, 
  Users, 
  ScanLine,
  ChevronRight,
  Activity
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/attendx.functions";

export function useProfile() {
  const [data, setData] = useState<{ profile: any; role: string; isLoading: boolean }>({
    profile: null,
    role: "student",
    isLoading: true,
  });

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        if (res) {
          setData({ profile: res.profile, role: res.role || "student", isLoading: false });
        } else {
          setData({ profile: null, role: "student", isLoading: false });
        }
      })
      .catch(() => setData({ profile: null, role: "student", isLoading: false }));
  }, []);

  return data;
}

export function AppShell({ children, title = "AttendX Portal", subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const navigate = useNavigate();
  const me = useProfile();
  const role = me?.role ?? "student";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, show: role === "student" },
    { to: "/scan", label: "Live Scanner", icon: ScanLine, show: role === "student" },
    { to: "/teacher", label: "Sessions & QR", icon: QrCode, show: role === "teacher" || role === "admin" },
    { to: "/security", label: "Security Center", icon: Radar, show: role !== "student" },
    { to: "/admin", label: "Administration", icon: Users, show: role === "admin" },
  ].filter((n) => n.show);

  const roleColors: Record<string, string> = {
    admin: "border-purple-500/40 bg-purple-500/10 text-purple-400",
    teacher: "border-sky-500/40 bg-sky-500/10 text-sky-400",
    student: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  };

  return (
    <div className="min-h-screen cyber-grid relative">
      {/* Top subtle glow banner */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-24 bg-gradient-to-r from-cyan-500/10 via-primary/20 to-purple-500/10 blur-3xl pointer-events-none" />

      {/* Modern Navbar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 via-accent/15 to-transparent border border-primary/30 group-hover:border-primary/60 transition-all shadow-lg group-hover:shadow-primary/20">
              <ShieldCheck className="h-6 w-6 text-primary transition-transform group-hover:scale-105" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">AttendX</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono-x uppercase tracking-wider font-semibold ${roleColors[role] || "border-border text-muted-foreground"}`}>
                  {role}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground hidden sm:block tracking-wide">Secure Anti-Proxy Platform</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/60 border border-border/60">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-background/60 [&.active]:bg-primary [&.active]:text-primary-foreground [&.active]:shadow-md [&.active]:shadow-primary/25"
                >
                  <n.icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{n.label}</span>
                </Link>
              ))}
            </div>

            {/* Profile quick tag + Sign out */}
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              {me?.profile?.full_name && (
                <span className="hidden lg:inline text-xs font-medium text-slate-300 px-2 py-1 rounded-md bg-secondary/40">
                  {me.profile.full_name}
                </span>
              )}
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-destructive/15 hover:border-destructive/40 hover:text-destructive"
                title="Sign out of AttendX"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main View Area */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>Portal</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-primary font-medium capitalize">{role}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-1.5 self-start sm:self-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono-x text-[11px] text-slate-300">Engine Active</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

export function StatCard({
  label,
  title,
  value,
  icon: Icon,
  tone = "primary",
  trend,
}: {
  label?: string;
  title?: string;
  value: string | number;
  icon: any;
  tone?: "primary" | "success" | "destructive" | "warning" | "accent";
  trend?: string;
  valueColor?: string;
}) {
  const displayLabel = label || title || "";
  const tones: Record<string, { icon: string; border: string; glow: string }> = {
    primary: {
      icon: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      border: "hover:border-sky-500/40",
      glow: "hover:shadow-sky-500/10",
    },
    success: {
      icon: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      border: "hover:border-emerald-500/40",
      glow: "hover:shadow-emerald-500/10",
    },
    destructive: {
      icon: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      border: "hover:border-rose-500/40",
      glow: "hover:shadow-rose-500/10",
    },
    warning: {
      icon: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      border: "hover:border-amber-500/40",
      glow: "hover:shadow-amber-500/10",
    },
    accent: {
      icon: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      border: "hover:border-purple-500/40",
      glow: "hover:shadow-purple-500/10",
    },
  };

  const style = tones[tone] || tones.primary;

  return (
    <div className={`glass-interactive p-5 relative overflow-hidden group ${style.border} ${style.glow}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{displayLabel}</span>
        <div className={`rounded-xl border p-2.5 transition-transform group-hover:scale-110 ${style.icon}`}>
          {typeof Icon === "function" ? (
            <Icon className="h-5 w-5" />
          ) : Icon && typeof Icon === "object" ? (
            Icon
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-3xl font-black tracking-tight text-white">{value}</p>
        {trend && <span className="text-[11px] font-mono-x text-emerald-400 font-semibold">{trend}</span>}
      </div>
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl pointer-events-none" />
    </div>
  );
}
