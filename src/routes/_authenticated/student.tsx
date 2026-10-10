import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Smartphone, ScanLine, Percent, BookOpen, CalendarCheck, CalendarX, ShieldAlert, Trash2 } from "lucide-react";
import { AppShell, StatCard } from "@/components/app-shell";
import { getStudentDashboard, registerDevice, revokeDevice } from "@/lib/attendx.functions";

export const Route = createFileRoute("/_authenticated/student")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — AttendX" },
      { name: "description", content: "Your attendance, verification status and registered devices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => getStudentDashboard().then(setData).catch((e) => setMsg(e.message));
  useEffect(() => {
    load();
  }, []);

  async function addDevice() {
    if (!deviceLabel.trim()) return;
    let publicKey: string | undefined;
    try {
      if (crypto.subtle) {
        const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
        const raw = await crypto.subtle.exportKey("spki", pair.publicKey);
        publicKey = btoa(String.fromCharCode(...new Uint8Array(raw)));
      }
    } catch {
      /* browser without Web Crypto — baseline registration still works */
    }
    await registerDevice({ data: { label: deviceLabel.trim(), publicKey } });
    setDeviceLabel("");
    load();
  }

  async function revoke(id: string) {
    await revokeDevice({ data: { deviceId: id } });
    load();
  }

  if (!data) return <AppShell title="Student Dashboard"><p className="text-muted-foreground">Loading…</p></AppShell>;

  const missed = Math.max(0, data.totalSessions - data.attended);
  const records = data.records.filter((r: any) =>
    !filter || r.attendance_sessions?.subjects?.name?.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <AppShell title="Student Dashboard">
      {msg && <p className="mb-4 rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{msg}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance" value={`${data.percentage}%`} icon={Percent} tone={data.percentage >= 75 ? "success" : "warning"} />
        <StatCard label="Classes conducted" value={data.totalSessions} icon={BookOpen} />
        <StatCard label="Attended" value={data.attended} icon={CalendarCheck} tone="success" />
        <StatCard label="Missed" value={missed} icon={CalendarX} tone="destructive" />
      </div>

      <div className="mt-4 glass p-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted-foreground">Overall attendance</span>
          <span className="font-semibold">{data.percentage}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${data.percentage}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="glass p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent attendance</h2>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by subject…" className="rounded-lg border border-input bg-background/60 px-3 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          {records.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No attendance records yet. Scan a session QR to get started.</p>
          ) : (
            <ul className="divide-y divide-border">
              {records.slice(0, 10).map((r: any) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{r.attendance_sessions?.subjects?.name ?? "Session"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.recorded_at).toLocaleString()}</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/scan" className="glow-primary mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]">
            <ScanLine className="h-4 w-4" /> Scan attendance QR
          </Link>
        </section>

        <div className="space-y-6">
          <section className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Smartphone className="h-4 w-4 text-primary" /> Registered devices</h2>
            {data.devices.length === 0 && <p className="text-sm text-muted-foreground">No devices registered. Some sessions require a registered device.</p>}
            <ul className="space-y-2">
              {data.devices.map((d: any) => (
                <li key={d.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{d.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.status === "active" ? "Active" : "Revoked"} · {new Date(d.created_at).toLocaleDateString()}
                      {d.public_key ? " · key-pair secured" : ""}
                    </p>
                  </div>
                  {d.status === "active" && (
                    <button onClick={() => revoke(d.id)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Revoke device">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input value={deviceLabel} onChange={(e) => setDeviceLabel(e.target.value)} placeholder="e.g. My laptop" className="flex-1 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary" />
              <button onClick={addDevice} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/70">Register</button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">A non-exportable key pair is generated in your browser when supported. Device identifiers alone never prove identity.</p>
          </section>

          <section className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-warning" /> Security notifications</h2>
            {data.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No security events on your account. </p>
            ) : (
              <ul className="space-y-2">
                {data.events.map((e: any) => (
                  <li key={e.id} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    <div>
                      <p className="font-medium">{e.explanation}</p>
                      <p className="text-muted-foreground">{e.event_type} · {new Date(e.created_at).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
