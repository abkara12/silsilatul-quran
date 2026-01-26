"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  limit,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

function toText(v: unknown) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v : String(v);
}

type LogRow = {
  dateKey: string;
  sabak?: string;
  sabakDhor?: string;
  dhor?: string;
  weeklyGoal?: string;
  sabakDhorMistakes?: string;
  dhorMistakes?: string;
};

export default function AdminStudentOverviewPage() {
  const params = useParams<{ uid: string }>();
  const studentUid = params.uid;

  const [me, setMe] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [studentEmail, setStudentEmail] = useState("");
  const [snapshot, setSnapshot] = useState<any>(null);

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setMe(u);
      setChecking(false);

      if (!u) {
        setIsAdmin(false);
        return;
      }

      const myDoc = await getDoc(doc(db, "users", u.uid));
      const role = myDoc.exists() ? (myDoc.data() as any).role : null;
      setIsAdmin(role === "admin");
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    async function load() {
      if (!studentUid) return;
      setErr(null);
      setLoading(true);

      try {
        const sDoc = await getDoc(doc(db, "users", studentUid));
        if (sDoc.exists()) {
          const data = sDoc.data() as any;
          setStudentEmail(toText(data.email));
          setSnapshot(data);
        }

        // ✅ Recent logs (last 30 days-ish)
        const q = query(
          collection(db, "users", studentUid, "logs"),
          orderBy("dateKey", "desc"),
          limit(30)
        );
        const snap = await getDocs(q);

        const rows: LogRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            dateKey: toText(data.dateKey || d.id),
            sabak: toText(data.sabak),
            sabakDhor: toText(data.sabakDhor),
            dhor: toText(data.dhor),
            weeklyGoal: toText(data.weeklyGoal),
            sabakDhorMistakes: toText(data.sabakDhorMistakes),
            dhorMistakes: toText(data.dhorMistakes),
          };
        });

        setLogs(rows);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load overview.");
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) load();
  }, [studentUid, isAdmin]);

  if (checking) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm">
          Loading…
        </div>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <FancyBg />
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-xl font-semibold">Please sign in</div>
            <div className="mt-4">
              <Link className="underline" href="/login">
                Go to login
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
            <div className="text-xl font-semibold">Not allowed</div>
            <p className="mt-2 text-gray-700">You are not an admin.</p>
            <div className="mt-6 flex gap-3">
              <Link className="underline" href="/">
                Home
              </Link>
              <Link className="underline" href="/admin">
                Admin
              </Link>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-gray-900">
      <FancyBg />

      <div className="max-w-5xl mx-auto px-5 sm:px-10 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="text-sm text-gray-600">Admin → Student Overview</div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
                {studentEmail || "Student"} Overview
              </h1>
              <p className="mt-2 text-gray-700">
                View progress + recent logs. (Admin view)
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="h-11 px-5 rounded-full border border-gray-200 bg-white/70 hover:bg-white grid place-items-center text-sm font-semibold"
              >
                Back
              </Link>
              <Link
                href={`/admin/student/${studentUid}`}
                className="h-11 px-5 rounded-full bg-black text-white hover:bg-gray-900 grid place-items-center text-sm font-semibold"
              >
                Log today’s work →
              </Link>
            </div>
          </div>

          {err && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          {/* snapshot cards */}
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard title="Current Sabak" value={toText(snapshot?.currentSabak) || "—"} />
            <InfoCard title="Current Sabak Dhor" value={toText(snapshot?.currentSabakDhor) || "—"} />
            <InfoCard title="Current Dhor" value={toText(snapshot?.currentDhor) || "—"} />
            <InfoCard title="Sabak Dhor Mistakes" value={toText(snapshot?.currentSabakDhorMistakes) || "—"} />
            <InfoCard title="Dhor Mistakes" value={toText(snapshot?.currentDhorMistakes) || "—"} />
            <InfoCard title="Weekly Goal" value={toText(snapshot?.weeklyGoal) || "—"} />
          </div>

          {/* logs */}
          <div className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-widest text-[#9c7c38]">
                  Recent logs
                </div>
                <div className="mt-1 text-lg font-semibold">Last {logs.length} entries</div>
              </div>
              {loading ? (
                <span className="text-sm text-gray-600">Loading…</span>
              ) : (
                <span className="text-sm text-gray-600">Newest first</span>
              )}
            </div>

            <div className="mt-4 grid gap-3">
              {loading ? (
                <div className="rounded-3xl border border-gray-200 bg-white/70 p-5">
                  Loading logs…
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-3xl border border-gray-200 bg-white/70 p-5">
                  No logs yet for this student.
                </div>
              ) : (
                logs.map((l) => (
                  <div
                    key={l.dateKey}
                    className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-5 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-sm font-semibold">{l.dateKey}</div>
                      <Link
                        href={`/admin/student/${studentUid}`}
                        className="text-sm font-semibold text-[#9c7c38] hover:underline"
                      >
                        Edit / add work →
                      </Link>
                    </div>

                    <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <Mini label="Sabak" value={l.sabak || "—"} />
                      <Mini label="Sabak Dhor" value={l.sabakDhor || "—"} />
                      <Mini label="Dhor" value={l.dhor || "—"} />
                      <Mini label="SD Mistakes" value={l.sabakDhorMistakes || "—"} />
                      <Mini label="D Mistakes" value={l.dhorMistakes || "—"} />
                      <Mini label="Weekly Goal" value={l.weeklyGoal || "—"} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="h-10" />
      </div>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white/70 to-white/40 backdrop-blur p-5 shadow-sm">
      <div className="text-xs uppercase tracking-widest text-[#9c7c38]">{title}</div>
      <div className="mt-2 text-base font-semibold text-gray-900">{value}</div>
      <div className="mt-2 h-1 w-12 rounded-full bg-[#9c7c38]/50" />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/70 px-4 py-3">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="mt-1 font-semibold text-gray-900">{value}</div>
    </div>
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
