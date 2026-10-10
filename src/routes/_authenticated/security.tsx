import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell, StatCard } from "@/components/app-shell";
import { getSecurityDashboard, reviewSecurityEvent } from "@/lib/attendx.functions";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer 
} from "recharts";
import { 
  ShieldAlert, ShieldCheck, Clock, Copy, AlertTriangle, RefreshCw, Smartphone, 
  XCircle, Lock, CheckCircle2, UserX, Activity, Eye, FileText, Check, X
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/security")({
  component: SecurityDashboard,
});

const SEVERITY_COLORS = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  low: "bg-success/20 text-success border-success/30"
};

const EVENT_TYPE_MAP = {
  qr_expired: { label: "QR Token Expired", icon: Clock },
  duplicate_attendance: { label: "Duplicate Attendance", icon: Copy },
  invalid_signature: { label: "Invalid Signature", icon: AlertTriangle },
  challenge_replayed: { label: "Replay Attack", icon: RefreshCw },
  unregistered_device: { label: "Unknown Device", icon: Smartphone },
  challenge_failed: { label: "Failed Verification", icon: XCircle },
  session_closed: { label: "Session Closed", icon: Lock },
};

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
const CHART_AXIS_STYLE = { fill: '#9ca3af', fontSize: 12 };
const CHART_GRID_STYLE = { stroke: '#374151', strokeDasharray: '3 3' };
const CHART_TOOLTIP_STYLE = { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' };

function SecurityDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await getSecurityDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async (eventId: string, status: 'reviewed' | 'dismissed') => {
    setReviewingId(eventId);
    try {
      await reviewSecurityEvent({ data: { eventId, reviewStatus: status, notes: "Reviewed from dashboard" } });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setReviewingId(null);
    }
  };

  const { stats, events = [], sessions = [], subjects = [], attendanceRows = [] } = data || {};

  const filteredEvents = useMemo(() => {
    return events.filter((e: any) => {
      if (filterType !== "all" && e.event_type !== filterType) return false;
      if (filterSeverity !== "all" && e.severity !== filterSeverity) return false;
      return true;
    });
  }, [events, filterType, filterSeverity]);

  // Derived Chart Data
  const attendanceBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    attendanceRows.forEach((row: any) => {
      if (row.status !== 'present') return;
      const session = sessions.find((s: any) => s.id === row.session_id);
      if (!session) return;
      const subject = subjects.find((s: any) => s.id === session.subject_id);
      if (!subject) return;
      counts[subject.code] = (counts[subject.code] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [attendanceRows, sessions, subjects]);

  const eventSeverityData = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    events.forEach((e: any) => {
      if (counts[e.severity] !== undefined) counts[e.severity]++;
    });
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [events]);

  const eventsByDay = useMemo(() => {
    const days: Record<string, any> = {};
    
    // Default to last 7 days empty
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days[dateStr] = { date: dateStr, accepted: 0, rejected: 0, invalid: 0, expired: 0 };
    }

    attendanceRows.forEach((row: any) => {
      const dateStr = new Date(row.created_at).toISOString().split('T')[0];
      if (days[dateStr]) {
        if (row.status === 'present') days[dateStr].accepted++;
        else days[dateStr].rejected++;
      }
    });
    
    events.forEach((e: any) => {
      const dateStr = new Date(e.created_at).toISOString().split('T')[0];
      if (days[dateStr]) {
        if (e.event_type === 'invalid_signature') days[dateStr].invalid++;
        if (e.event_type === 'qr_expired') days[dateStr].expired++;
      }
    });

    return Object.values(days);
  }, [attendanceRows, events]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="animate-pulse-ring w-16 h-16 rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold font-mono-x text-gradient flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              Security Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 flex items-start gap-2 max-w-3xl">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <span className="text-sm">
                Suspicious activity labels indicate anomalous patterns. AttendX never automatically accuses students — all flagged events require teacher review.
              </span>
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={stats?.students || 0}
            icon={<UserX className="w-5 h-5 text-accent" />}
            tone="accent"
          />
          <StatCard
            title="Active Sessions"
            value={stats?.activeSessions || 0}
            icon={<Activity className="w-5 h-5 text-primary" />}
            tone="primary"
          />
          <StatCard
            title="Present Today"
            value={stats?.present || 0}
            icon={<CheckCircle2 className="w-5 h-5 text-success" />}
            tone="success"
          />
          <StatCard
            title="Rejected Attempts"
            value={stats?.rejected || 0}
            icon={<ShieldAlert className="w-5 h-5 text-destructive" />}
            tone="destructive"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-5 rounded-xl border border-white/5 shadow-xl">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 font-mono-x">Attendance by Subject</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceBySubject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...CHART_GRID_STYLE} vertical={false} />
                  <XAxis dataKey="name" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Present" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass p-5 rounded-xl border border-white/5 shadow-xl">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 font-mono-x">Security Events Trend (7d)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eventsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...CHART_GRID_STYLE} />
                  <XAxis dataKey="date" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                  <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="invalid" stroke="#ef4444" strokeWidth={2} dot={false} name="Invalid Sigs" />
                  <Line type="monotone" dataKey="expired" stroke="#f59e0b" strokeWidth={2} dot={false} name="Expired QRs" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass p-5 rounded-xl border border-white/5 shadow-xl">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 font-mono-x">Event Severity Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventSeverityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {eventSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass p-5 rounded-xl border border-white/5 shadow-xl">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 font-mono-x">Accepted vs Rejected (7d)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...CHART_GRID_STYLE} vertical={false} />
                  <XAxis dataKey="date" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                  <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="accepted" fill="#22c55e" radius={[4, 4, 0, 0]} name="Accepted" stackId="a" />
                  <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejected" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Security Events Table */}
        <div className="glass rounded-xl border border-white/10 overflow-hidden shadow-2xl mt-8">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/20">
            <h3 className="text-lg font-medium font-mono-x flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Event Log
            </h3>
            
            <div className="flex gap-3">
              <select 
                className="bg-black/40 border border-white/10 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary transition-colors"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Event Types</option>
                {Object.entries(EVENT_TYPE_MAP).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select 
                className="bg-black/40 border border-white/10 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary transition-colors"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-black/40 border-b border-white/10 font-mono-x">
                <tr>
                  <th className="px-4 py-3 font-medium">Event ID</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Event Type</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                  <th className="px-4 py-3 font-medium">Review Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No security events match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event: any) => {
                    const typeConfig = EVENT_TYPE_MAP[event.event_type as keyof typeof EVENT_TYPE_MAP] || { label: event.event_type, icon: ShieldAlert };
                    const Icon = typeConfig.icon;
                    const severityClass = SEVERITY_COLORS[event.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.low;
                    
                    return (
                      <tr key={event.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono-x text-xs text-muted-foreground">
                          {event.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(event.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span>{typeConfig.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${severityClass}`}>
                            {event.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate" title={event.explanation || event.metadata?.message}>
                          {event.explanation || event.metadata?.message || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {event.review_status === 'pending' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/70">
                              PENDING
                            </span>
                          ) : event.review_status === 'reviewed' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-success/20 text-success">
                              REVIEWED
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                              DISMISSED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {event.review_status === 'pending' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleReview(event.id, 'reviewed')}
                                disabled={reviewingId === event.id}
                                className="p-1 hover:bg-success/20 text-success rounded transition-colors disabled:opacity-50"
                                title="Mark as Reviewed"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReview(event.id, 'dismissed')}
                                disabled={reviewingId === event.id}
                                className="p-1 hover:bg-white/10 text-muted-foreground rounded transition-colors disabled:opacity-50"
                                title="Dismiss Event"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
