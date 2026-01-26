"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

function getDateKeySA() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

type StudentRow = { uid: string; email: string };

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedUid, setSelectedUid] = useState<string>("");

  const [err, setErr] = useState<string | null>(null);

  const today = useMemo(() => getDateKeySA(), []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setChecking(false);

      if (!u) {
        setIsAdmin(false);
        return;
      }

      const me = await getDoc(doc(db, "users", u.uid));
      const role = me.exists() ? (me.data() as any).role : null;
      setIsAdmin(role === "admin");
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    async function loadStudents() {
      if (!isAdmin) return;
      setErr(null);
      setStudentsLoading(true);

      try {
        // ✅ Students list for dropdown
        const q = query(
          collection(db, "users"),
          where("role", "==", "student"),
          orderBy("email", "asc")
        );

        const snap = await getDocs(q);
        const rows: StudentRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return { uid: d.id, email: String(data.email ?? "").toLowerCase() };
        });

        setStudents(rows);
        setSelectedUid(rows[0]?.uid ?? "");
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load students.");
      } finally {
        setStudentsLoading(false);
      }
    }

    loadStudents();
  }, [isAdmin]);

  if (checking) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm">
          Loading…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <FancyBg />
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-sm text-gray-600">Admin</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">Please sign in</div>
            <p className="mt-2 text-gray-700">You need to be logged in as the Ustad/admin.</p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900"
              >
                Go to login
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
              >
                Home
              </Link>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <FancyBg />
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-sm text-gray-600">Admin</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">Not allowed</div>
            <p className="mt-2 text-gray-700">
              Your account is not an admin. (Firestore user doc needs <code className="px-2 py-0.5 rounded bg-black/5">role: "admin"</code>)
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
              >
                Home
              </Link>
              <Link
                href="/my-progress"
                className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900"
              >
                My Progress
              </Link>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const selectedStudent = students.find((s) => s.uid === selectedUid);

  return (
    <main className="min-h-screen text-gray-900">
      <FancyBg />

      <div className="max-w-5xl mx-auto px-5 sm:px-10 py-10">
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur px-4 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-[#9c7c38]" />
              <span className="text-gray-700">Ustad Admin</span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-700">
              Select a student and either{" "}
              <span className="font-semibold">log today’s work</span> or{" "}
              <span className="font-semibold">view their overview</span>. Today:{" "}
              <span className="font-semibold">{today}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
            >
              Home
            </Link>
            <Link
              href="/overview"
              className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900"
            >
              My Overview
            </Link>
          </div>
        </div>

        {/* main grid */}
        <div className="mt-8 grid lg:grid-cols-12 gap-6 items-stretch">
          {/* left: selector */}
          <div className="lg:col-span-7">
            <Card>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-sm uppercase tracking-widest text-[#9c7c38]">
                    Student Selector
                  </div>
                  <div className="mt-2 text-xl font-semibold">Choose a student</div>
                  <p className="mt-1 text-sm text-gray-700">
                    Dropdown is fastest for the Ustad (no typing).
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-xs text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Admin active
                </div>
              </div>

              {err && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {err}
                </div>
              )}

              <div className="mt-6">
                <label className="text-sm font-semibold text-gray-900">
                  Student Email
                </label>

                <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    value={selectedUid}
                    onChange={(e) => setSelectedUid(e.target.value)}
                    className="h-12 rounded-2xl border border-gray-200 bg-white/80 px-4 outline-none focus:ring-2 focus:ring-[#9c7c38]/35"
                    disabled={studentsLoading}
                  >
                    {studentsLoading ? (
                      <option>Loading students…</option>
                    ) : students.length === 0 ? (
                      <option>No students found</option>
                    ) : (
                      students.map((s) => (
                        <option key={s.uid} value={s.uid}>
                          {s.email}
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      // quick refresh
                      setStudentsLoading(true);
                      (async () => {
                        try {
                          const q = query(
                            collection(db, "users"),
                            where("role", "==", "student"),
                            orderBy("email", "asc")
                          );
                          const snap = await getDocs(q);
                          const rows: StudentRow[] = snap.docs.map((d) => {
                            const data = d.data() as any;
                            return { uid: d.id, email: String(data.email ?? "").toLowerCase() };
                          });
                          setStudents(rows);
                          if (!rows.find((r) => r.uid === selectedUid)) {
                            setSelectedUid(rows[0]?.uid ?? "");
                          }
                        } catch (e: any) {
                          setErr(e?.message ?? "Refresh failed");
                        } finally {
                          setStudentsLoading(false);
                        }
                      })();
                    }}
                    className="h-12 px-5 rounded-2xl border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
                  >
                    Refresh
                  </button>
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-3">
                  <Link
                    href={selectedUid ? `/admin/student/${selectedUid}` : "#"}
                    className={`inline-flex items-center justify-center h-12 px-6 rounded-2xl text-sm font-semibold transition-colors ${
                      selectedUid
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-black/30 text-white/70 pointer-events-none"
                    }`}
                  >
                    Log today’s work →
                  </Link>

                  <Link
                    href={selectedUid ? `/admin/student/${selectedUid}/overview` : "#"}
                    className={`inline-flex items-center justify-center h-12 px-6 rounded-2xl border text-sm font-semibold transition-colors ${
                      selectedUid
                        ? "border-gray-200 bg-white/70 hover:bg-white"
                        : "border-gray-200 bg-white/40 text-gray-400 pointer-events-none"
                    }`}
                  >
                    View student overview →
                  </Link>
                </div>

                {selectedStudent?.email && (
                  <div className="mt-5 rounded-3xl border border-gray-200 bg-gradient-to-br from-white/70 to-white/40 backdrop-blur p-5">
                    <div className="text-xs uppercase tracking-widest text-[#9c7c38]">
                      Selected
                    </div>
                    <div className="mt-1 text-base font-semibold">{selectedStudent.email}</div>
                    <div className="mt-1 text-sm text-gray-700">
                      UID: <span className="font-mono text-xs">{selectedStudent.uid}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* right: quick tips */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-gray-200 bg-black text-white p-8 shadow-xl relative overflow-hidden h-full">
              <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#9c7c38]/25 blur-2xl" />
              <div className="text-xs uppercase tracking-widest text-white/70">
                Workflow
              </div>
              <div className="mt-2 text-2xl font-semibold">Fastest way for the Ustad</div>
              <div className="mt-3 text-white/75 leading-relaxed text-sm">
                1) Select student from dropdown <br />
                2) Tap <span className="font-semibold">Log today’s work</span> <br />
                3) Save ✅ <br />
                4) Tap <span className="font-semibold">View student overview</span> anytime
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {["No passwords", "1-tap access", "Phone friendly", "Secure rules"].map((t) => (
                  <div key={t} className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
                    <div className="text-sm text-white/80">{t}</div>
                    <div className="mt-1 text-sm font-semibold">—</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* bottom spacer */}
        <div className="h-10" />
      </div>
    </main>
  );
}

function FancyBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
      <div className="absolute -top-56 left-[-10%] h-[780px] w-[780px] rounded-full bg-[#9c7c38]/30 blur-3xl" />
      <div className="absolute top-[-20%] right-[-15%] h-[900px] w-[900px] rounded-full bg-black/20 blur-3xl" />
      <div className="absolute -bottom-72 left-[20%] h-[980px] w-[980px] rounded-full bg-[#9c7c38]/22 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, rgba(0,0,0,0.18) 1px, transparent 1px), linear-gradient(-45deg, rgba(0,0,0,0.18) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          backgroundPosition: "0 0, 36px 36px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_15%,transparent_55%,rgba(0,0,0,0.12))]" />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-7 sm:p-8 shadow-sm">
      {children}
    </div>
  );
}
