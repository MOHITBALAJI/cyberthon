import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, StatCard, useProfile } from "@/components/app-shell";
import { getAdminOverview } from "@/lib/attendx.functions";
import { Users, BookOpen, QrCode, Shield, ShieldAlert, UserCheck, UserX, Building } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { profile, role, isLoading: isProfileLoading } = useProfile();
  const [data, setData] = useState<{
    users: any[];
    roles: any[];
    subjects: any[];
    sessions: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const isAdmin = role === "admin" || profile?.role === "admin";

  useEffect(() => {
    async function load() {
      try {
        if (isAdmin) {
          const res = await getAdminOverview();
          setData(res);
        }
      } catch (err) {
        console.error("Failed to load admin overview", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (!isProfileLoading) {
      load();
    }
  }, [isAdmin, isProfileLoading]);

  if (isProfileLoading || (isAdmin && isLoading)) {
    return (
      <AppShell title="Admin Panel">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse-ring w-12 h-12 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Admin Panel">
        <div className="glass rounded-xl p-8 max-w-md mx-auto mt-12 text-center border-[var(--destructive)]/30 border">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-[var(--destructive)] animate-pulse" />
          <h2 className="text-xl font-bold text-white mb-2 font-mono-x">ACCESS DENIED</h2>
          <p className="text-white/70">Administrator privileges required.</p>
        </div>
      </AppShell>
    );
  }

  const { users = [], roles = [], subjects = [], sessions = [] } = data || {};

  // Compute stats
  const totalUsers = users.length;
  const totalSubjects = subjects.length;
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s: any) => s.status === 'active').length;
  
  const draftSessions = sessions.filter((s: any) => s.status === 'draft').length;
  const closedSessions = sessions.filter((s: any) => s.status === 'closed').length;

  // Process users
  const usersWithRoles = users.map((u: any) => {
    const userRole = roles.find((r: any) => r.user_id === u.id);
    return {
      ...u,
      role: userRole?.role || 'unknown'
    };
  });

  const filteredUsers = roleFilter === 'all' 
    ? usersWithRoles 
    : usersWithRoles.filter((u: any) => u.role === roleFilter);

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'teacher': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'student': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <AppShell title="Admin Control Center">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={totalUsers} icon={<Users size={20} />} trend="+12% this week" />
          <StatCard title="Total Subjects" value={totalSubjects} icon={<BookOpen size={20} />} />
          <StatCard title="Total Sessions" value={totalSessions} icon={<QrCode size={20} />} />
          <StatCard title="Active Sessions" value={activeSessions} icon={<Shield size={20} />} trend="Live now" />
        </div>

        {/* USERS SECTION */}
        <section className="glass rounded-xl p-6 border border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white font-mono-x flex items-center gap-2">
                <Users className="text-[var(--primary)]" size={24} />
                User Management
              </h2>
              <p className="text-sm text-white/50 mt-1">
                User management is admin-only. Role changes require database access for security.
              </p>
            </div>
            
            <select 
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--primary)]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="teacher">Teachers</option>
              <option value="student">Students</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredUsers.map((user: any, idx: number) => (
                  <tr key={user.id} className={idx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                    <td className="p-3 text-white font-medium">{user.full_name || 'N/A'}</td>
                    <td className="p-3 text-white/70">{user.email || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-xs border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        active
                      </span>
                    </td>
                    <td className="p-3 text-white/50">
                      {new Date(user.created_at || Date.now()).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-white/50">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SUBJECTS TABLE */}
          <section className="glass rounded-xl p-6 border border-white/5 flex-1">
            <h2 className="text-xl font-bold text-white font-mono-x flex items-center gap-2 mb-2">
              <BookOpen className="text-[var(--accent)]" size={24} />
              Subjects
            </h2>
            <p className="text-sm text-white/50 mb-6">
              Subjects are assigned to teachers at creation time.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                    <th className="p-3 font-medium">Code</th>
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Dept</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {subjects.map((sub: any, idx: number) => (
                    <tr key={sub.id} className={idx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                      <td className="p-3 text-[var(--primary)] font-mono">{sub.code}</td>
                      <td className="p-3 text-white">{sub.name}</td>
                      <td className="p-3 text-white/70">{sub.department || 'N/A'}</td>
                    </tr>
                  ))}
                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-white/50">
                        No subjects found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-8 flex-1">
            {/* SESSIONS OVERVIEW */}
            <section className="glass rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-bold text-white font-mono-x flex items-center gap-2 mb-6">
                <QrCode className="text-[var(--success)]" size={24} />
                Sessions Overview
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-black/40 rounded-lg p-4 border border-white/5 text-center">
                  <div className="text-2xl font-bold text-white/70 mb-1">{draftSessions}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Draft</div>
                </div>
                <div className="bg-black/40 rounded-lg p-4 border border-[var(--success)]/20 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[var(--success)]/5 animate-pulse"></div>
                  <div className="relative text-2xl font-bold text-[var(--success)] mb-1">{activeSessions}</div>
                  <div className="relative text-xs text-[var(--success)]/70 uppercase tracking-wider">Active</div>
                </div>
                <div className="bg-black/40 rounded-lg p-4 border border-white/5 text-center">
                  <div className="text-2xl font-bold text-white/70 mb-1">{closedSessions}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Closed</div>
                </div>
              </div>
            </section>

            {/* SYSTEM INFO */}
            <section className="glass rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-bold text-white font-mono-x flex items-center gap-2 mb-4">
                <Shield className="text-white" size={24} />
                System Info
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50">Platform</span>
                  <span className="text-white font-medium text-right">AttendX Multi-Layer Secure Attendance</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50">Version</span>
                  <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded text-xs">1.0.0 Hackathon Edition</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50">Security Layers</span>
                  <div className="text-right flex flex-col gap-1">
                    <span className="text-[var(--primary)] text-xs border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2 py-0.5 rounded-full inline-block w-fit ml-auto">Rotating QR</span>
                    <span className="text-[var(--accent)] text-xs border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 rounded-full inline-block w-fit ml-auto">Challenge-Response</span>
                    <span className="text-white/70 text-xs border border-white/20 bg-white/5 px-2 py-0.5 rounded-full inline-block w-fit ml-auto">Device Registration</span>
                    <span className="text-white/70 text-xs border border-white/20 bg-white/5 px-2 py-0.5 rounded-full inline-block w-fit ml-auto">Room Code</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50">Database</span>
                  <span className="text-white font-medium">Supabase PostgreSQL</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/50">Auth</span>
                  <span className="text-white font-medium text-right">Supabase Auth + HMAC-SHA256</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
