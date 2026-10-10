import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- helpers (server-only, called inside handlers) ----------

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function b64url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(input: string): string {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(s + "=".repeat((4 - (s.length % 4)) % 4));
}

type Ctx = { supabase: any; userId: string };

async function logEvent(
  supabase: any,
  e: {
    user_id?: string | null;
    session_id?: string | null;
    event_type: string;
    severity: string;
    explanation: string;
    decision: string;
  },
) {
  await supabase.from("security_events").insert({
    user_id: e.user_id ?? null,
    session_id: e.session_id ?? null,
    event_type: e.event_type,
    severity: e.severity,
    explanation: e.explanation,
    decision: e.decision,
  });
}

async function roleOf(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return data?.role ?? "student";
}

// ---------- profile ----------

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const [{ data: profile }, role] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      roleOf(supabase, userId),
    ]);
    return { profile, role };
  });

// ---------- sessions (teacher) ----------

export const createSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { subjectId: string; durationMin: number; requireDevice: boolean; requireRoomCode: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    if ((await roleOf(supabase, userId)) === "student") throw new Error("Forbidden");
    const roomCode = data.requireRoomCode
      ? String(Math.floor(100000 + Math.random() * 900000))
      : null;
    const { data: session, error } = await supabase
      .from("attendance_sessions")
      .insert({
        subject_id: data.subjectId,
        teacher_id: userId,
        status: "draft",
        require_device: data.requireDevice,
        require_room_code: data.requireRoomCode,
        room_code: roomCode,
        ends_at: null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return session;
  });

export const startSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string; durationMin: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const now = new Date();
    const ends = new Date(now.getTime() + data.durationMin * 60000);
    const { error } = await supabase
      .from("attendance_sessions")
      .update({ status: "active", started_at: now.toISOString(), ends_at: ends.toISOString() })
      .eq("id", data.sessionId)
      .eq("teacher_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, endsAt: ends.toISOString() };
  });

export const closeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const { error } = await supabase
      .from("attendance_sessions")
      .update({ status: "closed", ends_at: new Date().toISOString() })
      .eq("id", data.sessionId)
      .eq("teacher_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSubjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as unknown as Ctx;
    const { data } = await supabase.from("subjects").select("*").order("code");
    return data ?? [];
  });

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const role = await roleOf(supabase, userId);
    let q = supabase
      .from("attendance_sessions")
      .select("*, subjects(name, code)")
      .order("created_at", { ascending: false });
    if (role === "teacher") q = q.eq("teacher_id", userId);
    const { data } = await q;
    return data ?? [];
  });

// Rotating QR: issues a fresh signed token, valid 25 seconds.
export const getSessionQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const { data: session } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", data.sessionId)
      .single();
    if (!session || session.teacher_id !== userId) throw new Error("Forbidden");
    if (session.status !== "active") throw new Error("Session is not active");
    if (session.ends_at && new Date(session.ends_at).getTime() < Date.now()) {
      await supabase.from("attendance_sessions").update({ status: "closed" }).eq("id", session.id);
      throw new Error("Session has ended");
    }
    const secret = process.env["QR_SIGNING_SECRET"]!;
    const tokenId = crypto.randomUUID();
    const exp = Date.now() + 25_000;
    const payload = `${session.id}.${tokenId}.${exp}`;
    const sig = await hmacSign(secret, payload);
    await supabase.from("qr_tokens").insert({
      session_id: session.id,
      token_id: tokenId,
      expires_at: new Date(exp).toISOString(),
    });
    return { token: `${b64url(payload)}.${sig}`, expiresAt: exp };
  });

export const getSessionAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const { data: session } = await supabase
      .from("attendance_sessions")
      .select("*, subjects(name, code)")
      .eq("id", data.sessionId)
      .single();
    if (!session) throw new Error("Not found");
    const role = await roleOf(supabase, userId);
    if (role === "student" && session.teacher_id !== userId) throw new Error("Forbidden");
    const { data: rows } = await supabase
      .from("attendance")
      .select("*, profiles(full_name, reg_no)")
      .eq("session_id", data.sessionId)
      .order("recorded_at", { ascending: false });
    return { session, attendance: rows ?? [] };
  });

export const exportSessionCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const { data: session } = await supabase
      .from("attendance_sessions")
      .select("*, subjects(name, code)")
      .eq("id", data.sessionId)
      .single();
    if (!session || session.teacher_id !== userId) throw new Error("Forbidden");
    const { data: rows } = await supabase
      .from("attendance")
      .select("*, profiles(full_name, reg_no)")
      .eq("session_id", data.sessionId);
    const header = "Student,Reg No,Status,Recorded At\n";
    const body = (rows ?? [])
      .map((r: any) =>
        [r.profiles?.full_name ?? "", r.profiles?.reg_no ?? "", r.status, r.recorded_at]
          .map((v: string) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    return { csv: header + body, filename: `attendx-${session.subjects?.code ?? "session"}-${session.id.slice(0, 8)}.csv` };
  });

// ---------- attendance flow (student) ----------

export const scanQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const fail = async (type: string, severity: string, explanation: string, sessionId?: string) => {
      await logEvent(supabase, {
        user_id: userId,
        session_id: sessionId ?? null,
        event_type: type,
        severity,
        explanation,
        decision: "rejected",
      });
      return { ok: false as const, error: explanation, code: type };
    };

    // 1. Parse + verify signature
    const parts = data.token.split(".");
    if (parts.length !== 2) return fail("invalid_token", "high", "Malformed QR token submitted.");
    let payload: string;
    try {
      payload = fromB64url(parts[0]);
    } catch {
      return fail("invalid_token", "high", "Malformed QR token submitted.");
    }
    const secret = process.env["QR_SIGNING_SECRET"]!;
    const expected = await hmacSign(secret, payload);
    if (expected !== parts[1])
      return fail("invalid_signature", "critical", "QR token signature is invalid — possible forgery attempt.");

    const [sessionId, tokenId, expStr] = payload.split(".");
    const exp = Number(expStr);

    // 2. Token must have been issued by the server for this session
    const { data: issued } = await supabase
      .from("qr_tokens")
      .select("id")
      .eq("session_id", sessionId)
      .eq("token_id", tokenId)
      .maybeSingle();
    if (!issued)
      return fail("unknown_token", "high", "QR token was never issued by the server.", sessionId);

    // 3. Server-side expiration check (never trust the device clock)
    if (Date.now() > exp)
      return fail("qr_expired", "medium", "QR token expired. Tokens rotate every 25 seconds.", sessionId);

    // 4. Session must be active
    const { data: session } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    if (!session || session.status !== "active")
      return fail("session_closed", "medium", "This attendance session is not active.", sessionId);
    if (session.ends_at && new Date(session.ends_at).getTime() < Date.now())
      return fail("session_closed", "medium", "This attendance session has ended.", sessionId);

    // 5. Duplicate attendance check
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("session_id", sessionId)
      .eq("student_id", userId)
      .maybeSingle();
    if (existing)
      return fail("duplicate_attendance", "medium", "Attendance already recorded for this session.", sessionId);

    // 6. Device policy
    let deviceId: string | null = null;
    if (session.require_device) {
      const { data: device } = await supabase
        .from("devices")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (!device)
        return fail("unregistered_device", "high", "No registered device on this account. Register a device first.", sessionId);
      deviceId = device.id;
    }

    // 7. Issue one-time challenge (4-symbol sequence, 45s TTL)
    const symbols = ["▲", "●", "■", "◆", "★", "⬢"];
    const shuffled = [...symbols].sort(() => Math.random() - 0.5);
    const answer = shuffled.slice(0, 4);
    const display = [...answer].sort(() => Math.random() - 0.5);
    const { data: challenge, error } = await supabase
      .from("challenges")
      .insert({
        student_id: userId,
        session_id: sessionId,
        sequence: { answer, display },
        expires_at: new Date(Date.now() + 45_000).toISOString(),
      })
      .select("id, sequence, expires_at")
      .single();
    if (error) throw new Error(error.message);

    return {
      ok: true as const,
      challengeId: challenge.id,
      display,
      expiresAt: challenge.expires_at,
      requireRoomCode: session.require_room_code as boolean,
      deviceId,
      sessionId,
    };
  });

export const verifyChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { challengeId: string; answer: string[]; roomCode?: string; deviceId?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const fail = async (type: string, severity: string, explanation: string, sessionId?: string | null) => {
      await logEvent(supabase, {
        user_id: userId,
        session_id: sessionId ?? null,
        event_type: type,
        severity,
        explanation,
        decision: "rejected",
      });
      return { ok: false as const, error: explanation, code: type };
    };

    const { data: ch } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", data.challengeId)
      .maybeSingle();
    if (!ch) return fail("invalid_challenge", "high", "Unknown verification challenge.");
    if (ch.student_id !== userId)
      return fail("challenge_mismatch", "critical", "Challenge belongs to a different account — possible credential sharing.", ch.session_id);
    if (ch.used_at)
      return fail("challenge_replayed", "high", "This challenge was already used. Replay blocked.", ch.session_id);
    if (new Date(ch.expires_at).getTime() < Date.now())
      return fail("challenge_expired", "low", "Verification challenge expired.", ch.session_id);

    const { data: session } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", ch.session_id)
      .single();
    if (!session || session.status !== "active")
      return fail("session_closed", "medium", "This attendance session is no longer active.", ch.session_id);

    // Mark used immediately (single-use guarantee)
    await supabase.from("challenges").update({ used_at: new Date().toISOString() }).eq("id", ch.id);

    const expected = (ch.sequence as { answer: string[] }).answer;
    const correct = expected.length === data.answer.length && expected.every((s, i) => s === data.answer[i]);
    if (!correct)
      return fail("challenge_failed", "medium", "Incorrect verification sequence.", ch.session_id);

    if (session.require_room_code) {
      if (!data.roomCode || data.roomCode.trim() !== session.room_code)
        return fail("room_code_failed", "medium", "Incorrect in-room verification code.", ch.session_id);
    }

    // Record attendance — unique(student_id, session_id) blocks duplicates at the DB level
    const { error } = await supabase.from("attendance").insert({
      student_id: userId,
      session_id: ch.session_id,
      device_id: data.deviceId ?? null,
      status: "verified",
    });
    if (error) {
      if (error.code === "23505")
        return fail("duplicate_attendance", "medium", "Attendance already recorded for this session.", ch.session_id);
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const getStudentDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const [{ data: records }, { data: devices }, { data: events }, { data: sessions }] = await Promise.all([
      supabase
        .from("attendance")
        .select("*, attendance_sessions(started_at, subjects(name, code))")
        .eq("student_id", userId)
        .order("recorded_at", { ascending: false }),
      supabase.from("devices").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("security_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("attendance_sessions").select("id, status, started_at, subjects(name, code)").neq("status", "draft"),
    ]);
    const totalSessions = (sessions ?? []).length;
    const attended = (records ?? []).length;
    return {
      records: records ?? [],
      devices: devices ?? [],
      events: events ?? [],
      totalSessions,
      attended,
      percentage: totalSessions ? Math.round((attended / totalSessions) * 100) : 0,
    };
  });

// ---------- devices ----------

export const registerDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { label: string; publicKey?: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const { data: device, error } = await supabase
      .from("devices")
      .insert({ user_id: userId, label: data.label, public_key: data.publicKey ?? null, status: "active" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await logEvent(supabase, {
      user_id: userId,
      event_type: "device_registered",
      severity: "low",
      explanation: `Device "${data.label}" registered.`,
      decision: "accepted",
    });
    return device;
  });

export const revokeDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { deviceId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const { error } = await supabase
      .from("devices")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", data.deviceId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    await logEvent(supabase, {
      user_id: userId,
      event_type: "device_revoked",
      severity: "low",
      explanation: "A registered device was revoked by its owner.",
      decision: "accepted",
    });
    return { ok: true };
  });

// ---------- security dashboard ----------

export const getSecurityDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    const role = await roleOf(supabase, userId);
    if (role === "student") throw new Error("Forbidden");
    const [
      { count: students },
      { count: activeSessions },
      { count: present },
      { count: rejected },
      { data: events },
      { data: sessions },
      { data: subjects },
    ] = await Promise.all([
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("attendance_sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("attendance").select("id", { count: "exact", head: true }),
      supabase.from("security_events").select("id", { count: "exact", head: true }).eq("decision", "rejected"),
      supabase.from("security_events").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("attendance_sessions").select("id, started_at, status, subjects(name, code)"),
      supabase.from("subjects").select("id, name, code"),
    ]);
    const { data: attendanceRows } = await supabase.from("attendance").select("session_id");
    return {
      stats: {
        students: students ?? 0,
        activeSessions: activeSessions ?? 0,
        present: present ?? 0,
        rejected: rejected ?? 0,
      },
      events: events ?? [],
      sessions: sessions ?? [],
      subjects: subjects ?? [],
      attendanceRows: attendanceRows ?? [],
    };
  });

export const reviewSecurityEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { eventId: string; status: "reviewed" | "dismissed" }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    if ((await roleOf(supabase, userId)) === "student") throw new Error("Forbidden");
    const { error } = await supabase
      .from("security_events")
      .update({ review_status: data.status })
      .eq("id", data.eventId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- admin ----------

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as unknown as Ctx;
    if ((await roleOf(supabase, userId)) !== "admin") throw new Error("Forbidden");
    const [{ data: users }, { data: roles }, { data: subjects }, { data: sessions }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("subjects").select("*"),
      supabase.from("attendance_sessions").select("id, status"),
    ]);
    return { users: users ?? [], roles: roles ?? [], subjects: subjects ?? [], sessions: sessions ?? [] };
  });

// ---------- demo seed (hackathon) ----------

export const seedDemoData = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin.from("subjects").select("id").limit(1);
  if (existing && existing.length > 0) return { ok: false, error: "Demo data already loaded." };

  const password = "Demo1234!";
  const make = async (email: string, name: string, role: "admin" | "teacher" | "student", reg?: string) => {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role, reg_no: reg },
    });
    if (error) throw new Error(`${email}: ${error.message}`);
    return data.user.id;
  };

  const adminId = await make("admin@attendx.demo", "Demo Admin", "admin");
  const teacherId = await make("teacher@attendx.demo", "Dr. Priya Sharma", "teacher");
  const studentIds: string[] = [];
  const names = ["Aarav Patel", "Diya Reddy", "Rohan Mehta", "Sneha Iyer", "Karan Singh"];
  for (let i = 0; i < names.length; i++) {
    studentIds.push(await make(`student${i + 1}@attendx.demo`, names[i], "student", `CS2026${10 + i}`));
  }

  const { data: subs } = await supabaseAdmin
    .from("subjects")
    .insert([
      { name: "Cyber Security Fundamentals", code: "CS401", teacher_id: teacherId, department: "CSE" },
      { name: "Network Security", code: "CS402", teacher_id: teacherId, department: "CSE" },
      { name: "Cryptography", code: "CS403", teacher_id: teacherId, department: "CSE" },
    ])
    .select();

  // Historical sessions + attendance
  for (const sub of subs ?? []) {
    for (let d = 4; d >= 1; d--) {
      const start = new Date(Date.now() - d * 86400000);
      const { data: sess } = await supabaseAdmin
        .from("attendance_sessions")
        .insert({
          subject_id: sub.id,
          teacher_id: teacherId,
          status: "closed",
          started_at: start.toISOString(),
          ends_at: new Date(start.getTime() + 3600000).toISOString(),
        })
        .select()
        .single();
      // ~80% attendance
      for (const sid of studentIds) {
        if (Math.random() < 0.8) {
          await supabaseAdmin.from("attendance").insert({
            student_id: sid,
            session_id: sess!.id,
            status: "verified",
            recorded_at: new Date(start.getTime() + 300000).toISOString(),
          });
        }
      }
    }
  }

  // Sample security events
  const sampleEvents = [
    { event_type: "qr_expired", severity: "medium", explanation: "QR token expired. Tokens rotate every 25 seconds.", decision: "rejected" },
    { event_type: "duplicate_attendance", severity: "medium", explanation: "Attendance already recorded for this session.", decision: "rejected" },
    { event_type: "invalid_signature", severity: "critical", explanation: "QR token signature is invalid — possible forgery attempt.", decision: "rejected" },
    { event_type: "challenge_replayed", severity: "high", explanation: "This challenge was already used. Replay blocked.", decision: "rejected" },
    { event_type: "unregistered_device", severity: "high", explanation: "No registered device on this account.", decision: "rejected" },
  ];
  for (let i = 0; i < sampleEvents.length; i++) {
    await supabaseAdmin.from("security_events").insert({
      ...sampleEvents[i],
      user_id: studentIds[i % studentIds.length],
      created_at: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
    });
  }

  return { ok: true, adminId, teacherId };
});
