import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { AppShell, StatCard } from "@/components/app-shell";
import { 
  createSession, 
  startSession, 
  closeSession, 
  listSubjects, 
  listSessions, 
  getSessionQr, 
  getSessionAttendance, 
  exportSessionCsv,
  createSubject
} from "@/lib/attendx.functions";
import { supabase } from "@/integrations/supabase/client";
import QRCode from 'qrcode';
import { Play, Square, Download, Plus, Clock, Users, QrCode, FileCheck, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teacher")({
  component: TeacherDashboard,
});

function TeacherDashboard() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Create Subject Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", code: "", department: "" });

  // State for Create Session Modal
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newSession, setNewSession] = useState({ subjectId: "", durationMin: 60, requireDevice: true, requireRoomCode: true });

  // Active view states
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  
  // QR and OTP states
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [currentOtp, setCurrentOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const qrIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const loadInitialData = async () => {
    try {
      const [subs, sess] = await Promise.all([
        listSubjects(),
        listSessions()
      ]);
      setSubjects(subs);
      setSessions(sess);
      
      const active = sess.find(s => s.status === 'active');
      if (active) {
        viewSession(active.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Direct client supabase insert with current user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated. Please log in.");

      const { data: sub, error } = await supabase
        .from('subjects')
        .insert({ 
          name: newSubject.name.trim(), 
          code: newSubject.code.trim().toUpperCase(), 
          teacher_id: user.id, 
          department: newSubject.department.trim() 
        })
        .select()
        .single();

      if (error) {
        // Fallback to server function
        await createSubject({ data: newSubject });
      }

      setShowSubjectModal(false);
      setNewSubject({ name: "", code: "", department: "" });
      await loadInitialData();
    } catch (err: any) {
      console.error(err);
      alert(`Subject creation note: ${err?.message || "Error occurred"}`);
      // Refresh list anyway in case it was created
      loadInitialData();
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sess = await createSession({ data: newSession });
      setShowSessionModal(false);
      loadInitialData();
      viewSession(sess.id);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to create session: ${err?.message || "Check if Supabase database tables exist"}`);
    }
  };

  const loadAttendance = useCallback(async (sessionId: string) => {
    try {
      const { session, attendance: att } = await getSessionAttendance({ data: { sessionId } });
      setActiveSession(session);
      setAttendance(att);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const viewSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    loadAttendance(sessionId);
  };

  // Real-time attendance
  useEffect(() => {
    if (!activeSessionId) return;

    const sub = supabase
      .channel('attendance_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'attendance',
        filter: `session_id=eq.${activeSessionId}`
      }, (payload) => {
        loadAttendance(activeSessionId); // Reload to get full profiles data
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [activeSessionId, loadAttendance]);

  // QR Code Rotation
  useEffect(() => {
    if (activeSession?.status === 'active') {
      const fetchQr = async () => {
        try {
          const res = await getSessionQr({ data: { sessionId: activeSession.id } });
          const url = await QRCode.toDataURL(res.token, { 
            color: { dark: '#00ffff', light: '#00000000' },
            width: 300
          });
          setQrBase64(url);
          if (res.otp) {
            setCurrentOtp(res.otp);
          }
          setCountdown(25);
        } catch (e) {
          console.error("QR Fetch Error:", e);
        }
      };

      fetchQr();
      qrIntervalRef.current = setInterval(fetchQr, 25000);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => {
        if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
    } else {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, [activeSession?.status, activeSession?.id]);

  const handleStartSession = async () => {
    if (!activeSession) return;
    try {
      await startSession({ data: { sessionId: activeSession.id, durationMin: 60 } });
      loadAttendance(activeSession.id);
      loadInitialData(); // update list
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      await closeSession({ data: { sessionId: activeSession.id } });
      loadAttendance(activeSession.id);
      loadInitialData(); // update list
      setQrBase64(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = async () => {
    if (!activeSession) return;
    try {
      const res = await exportSessionCsv({ data: { sessionId: activeSession.id } });
      const blob = new Blob([res.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <AppShell><div className="p-8 text-center animate-pulse">Loading dashboard...</div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-mono-x text-gradient">Teacher Dashboard</h1>
            <p className="text-zinc-400">Manage your classes and monitor live attendance.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSubjectModal(true)}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              Add Subject
            </button>
            <button 
              onClick={() => setShowSessionModal(true)}
              className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-lg text-sm font-medium transition-colors flex items-center gap-2 glow-primary"
            >
              <Plus className="w-4 h-4" /> New Session
            </button>
          </div>
        </div>

        {(subjects.length === 0) && (
          <div className="glass p-8 text-center rounded-xl border border-warning/30 bg-warning/5">
            <h3 className="text-xl font-bold mb-2 text-warning">No Subjects Found</h3>
            <p className="text-zinc-400 mb-4">You need to create a subject before you can start a session.</p>
            <button 
              onClick={() => setShowSubjectModal(true)}
              className="px-6 py-2 bg-warning/20 border border-warning/50 text-warning rounded-lg font-medium hover:bg-warning/30 transition-colors"
            >
              Create Your First Subject
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Sessions List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold font-mono-x">Recent Sessions</h2>
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {sessions.length === 0 ? (
                <div className="text-zinc-500 text-sm">No sessions yet.</div>
              ) : (
                sessions.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => viewSession(s.id)}
                    className={`glass p-4 rounded-xl cursor-pointer transition-all border ${
                      activeSessionId === s.id ? 'border-primary bg-primary/10' : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-zinc-100">{s.subjects?.code}</div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        s.status === 'active' ? 'bg-success/20 text-success border border-success/30' :
                        s.status === 'closed' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' :
                        'bg-warning/20 text-warning border border-warning/30'
                      }`}>
                        {s.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Active Session View */}
          <div className="lg:col-span-2">
            {activeSessionId && activeSession ? (
              <div className="glass p-6 rounded-2xl border border-zinc-800 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold font-mono-x text-zinc-100">{activeSession.subjects?.name}</h2>
                    <p className="text-sm text-zinc-400">{activeSession.subjects?.code} &bull; {new Date(activeSession.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {activeSession.status === 'draft' && (
                      <button onClick={handleStartSession} className="px-4 py-2 bg-success/20 hover:bg-success/30 text-success border border-success/50 rounded-lg flex items-center gap-2 transition-colors">
                        <Play className="w-4 h-4" /> Start Session
                      </button>
                    )}
                    {activeSession.status === 'active' && (
                      <button onClick={handleCloseSession} className="px-4 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/50 rounded-lg flex items-center gap-2 transition-colors">
                        <Square className="w-4 h-4" /> End Session
                      </button>
                    )}
                    {activeSession.status === 'closed' && (
                      <button onClick={handleExport} className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-lg flex items-center gap-2 transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard 
                    title="Status" 
                    value={activeSession.status} 
                    icon={activeSession.status === 'active' ? <Clock className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />} 
                    tone={activeSession.status === 'active' ? 'success' : activeSession.status === 'closed' ? 'primary' : 'warning'}
                  />
                  <StatCard 
                    title="Present" 
                    value={attendance.length.toString()} 
                    icon={<Users className="w-5 h-5" />} 
                  />
                  {activeSession.require_room_code && (
                    <StatCard 
                      title="Room Code" 
                      value={activeSession.room_code || '---'} 
                      icon={<QrCode className="w-5 h-5" />} 
                      tone="accent" 
                    />
                  )}
                  {activeSession.status === 'active' && activeSession.ends_at && (
                    <StatCard 
                      title="Ends At" 
                      value={new Date(activeSession.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                      icon={<Clock className="w-5 h-5" />} 
                    />
                  )}
                </div>

                {activeSession.status === 'active' && (
                  <div className="flex flex-col md:flex-row gap-8 mb-8 items-center justify-center p-8 border border-primary/30 rounded-xl bg-primary/5">
                    <div className="relative">
                      {qrBase64 ? (
                        <div className="p-4 bg-white rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                          <img src={qrBase64} alt="Attendance QR Code" className="w-64 h-64 object-contain" />
                        </div>
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-primary/50 rounded-xl animate-pulse">
                          <span className="text-primary font-mono-x">Generating...</span>
                        </div>
                      )}
                      
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-zinc-900 border border-primary text-primary px-4 py-1 rounded-full text-sm font-mono-x flex items-center gap-2">
                        <Clock className="w-4 h-4" /> 
                        <span className="w-6 text-center">{countdown}s</span>
                      </div>
                    </div>
                    
                    <div className="max-w-sm text-center md:text-left space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-gradient mb-1">Live Rotating Verification</h3>
                        <p className="text-zinc-400 text-xs">Students scan the QR code or enter the rolling session OTP.</p>
                      </div>

                      {/* Prominent Rotating OTP Banner */}
                      <div className="glass p-4 rounded-xl border border-primary/40 bg-black/40">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono-x uppercase tracking-wider text-primary font-bold">Session Security OTP</span>
                          <span className="text-[10px] font-mono-x text-amber-400">Rotates in {countdown}s</span>
                        </div>
                        <div className="text-3xl font-black font-mono-x tracking-widest text-white py-1 text-center bg-primary/10 rounded-lg border border-primary/20">
                          {currentOtp || activeSession.room_code || "------"}
                        </div>
                        <p className="text-[10px] text-zinc-400 text-center mt-1.5">Students can enter this 6-digit OTP during verification</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg justify-center md:justify-start">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        HMAC-SHA256 Token & OTP Auto-rotating every 25s
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">Attendance Record</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-zinc-500 uppercase font-mono-x text-xs">
                        <tr>
                          <th className="px-4 py-2">Student</th>
                          <th className="px-4 py-2">Reg No</th>
                          <th className="px-4 py-2">Time</th>
                          <th className="px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {attendance.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">No attendance recorded yet.</td></tr>
                        ) : (
                          attendance.map(r => (
                            <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-zinc-200">{r.profiles?.full_name || 'Unknown'}</td>
                              <td className="px-4 py-3 text-zinc-400 font-mono-x">{r.profiles?.reg_no || '---'}</td>
                              <td className="px-4 py-3 text-zinc-400">{new Date(r.recorded_at).toLocaleTimeString()}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                                  <CheckCircle2 className="w-3 h-3" /> {r.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl p-8">
                <QrCode className="w-16 h-16 mb-4 opacity-50" />
                <p>Select a session to view details or create a new one.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass w-full max-w-md rounded-2xl border border-zinc-800 p-6 shadow-2xl relative">
            <button onClick={() => setShowSubjectModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 font-mono-x">Create Subject</h2>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Subject Name</label>
                <input required type="text" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="e.g. Cyber Security" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Subject Code</label>
                <input required type="text" value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="e.g. CS401" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Department</label>
                <input required type="text" value={newSubject.department} onChange={e => setNewSubject({...newSubject, department: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="e.g. Computer Science" />
              </div>
              <button type="submit" className="w-full py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors mt-2">
                Create Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass w-full max-w-md rounded-2xl border border-primary/30 p-6 shadow-2xl relative shadow-[0_0_30px_rgba(0,255,255,0.1)]">
            <button onClick={() => setShowSessionModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 font-mono-x text-gradient">New Session</h2>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Subject</label>
                <select required value={newSession.subjectId} onChange={e => setNewSession({...newSession, subjectId: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary">
                  <option value="">Select a subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div>
                  <div className="font-medium text-sm">Require Device</div>
                  <div className="text-xs text-zinc-500">Only allow registered devices</div>
                </div>
                <input type="checkbox" checked={newSession.requireDevice} onChange={e => setNewSession({...newSession, requireDevice: e.target.checked})} className="w-4 h-4 accent-primary" />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div>
                  <div className="font-medium text-sm">Require Room Code</div>
                  <div className="text-xs text-zinc-500">Show a code on board to verify physical presence</div>
                </div>
                <input type="checkbox" checked={newSession.requireRoomCode} onChange={e => setNewSession({...newSession, requireRoomCode: e.target.checked})} className="w-4 h-4 accent-primary" />
              </div>

              <button type="submit" disabled={!newSession.subjectId} className="w-full py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                Create Session
              </button>
            </form>
          </div>
        </div>
      )}

    </AppShell>
  );
}
