/* app/admin/student/[uid]/overview/page.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDoc, getDocs, orderBy, query, doc } from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

/* ---------------- helpers ---------------- */
function toText(v: unknown) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v : String(v);
}

function num(v: unknown) {
  const s = toText(v).trim();
  if (!s) return 0;
  const m = s.replace(",", ".").match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}

type LogRow = {
  id: string;
  dateKey?: string;
  sabak?: string;
  sabakDhor?: string;
  dhor?: string;
  weeklyGoal?: string;

  sabakDhorMistakes?: string;
  dhorMistakes?: string;

  // ✅ weekly goal completion
  goalCompleted?: boolean;
  goalCompletedInDays?: number;
};

async function fetchLogs(uid: string): Promise<LogRow[]> {
  const q = query(collection(db, "users", uid, "logs"), orderBy("dateKey", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur">
      {children}
    </span>
  );
}

function MistakePill({ value, isBad }: { value: string; isBad: boolean }) {
  const v = toText(value) || "—";
  return (
    <span
      className={[
        "inline-flex items-center justify-center min-w-[2.25rem] h-9 px-3 rounded-full border text-sm font-semibold",
        isBad
          ? "border-red-300 bg-red-50 text-red-700"
          : "border-gray-200 bg-white/70 text-gray-800",
      ].join(" ")}
    >
      {v}
    </span>
  );
}

/* ---------------- page ---------------- */
export default function AdminStudentOverviewPage() {
  const params = useParams<{ uid: string }>();
  const studentUid = params.uid;

  const [me, setMe] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [studentEmail, setStudentEmail] = useState<string>("");

  const [rows, setRows] = useState<LogRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setMe(u);

      if (!u) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const myDoc = await getDoc(doc(db, "users", u.uid));
        const role = myDoc.exists() ? (myDoc.data() as any).role : null;
        setIsAdmin(role === "admin");
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    async function loadStudentMeta() {
      const sDoc = await getDoc(doc(db, "users", studentUid));
      if (sDoc.exists()) {
        setStudentEmail(toText((sDoc.data() as any).email));
      }
    }

    async function loadLogs() {
      setLoadingRows(true);
      try {
        const data = await fetchLogs(studentUid);
        setRows(data);
      } finally {
        setLoadingRows(false);
      }
    }

    if (studentUid) {
      loadStudentMeta();
      loadLogs();
    }
  }, [studentUid]);

  const summary = useMemo(() => {
    if (!rows.length) return { totalDays: 0, avgSabak: 0, lastGoal: 0 };
    const sabakNums = rows.map((r) => num(r.sabak)).filter((n) => n > 0);
    const avgSabak =
      sabakNums.length ? sabakNums.reduce((a, b) => a + b, 0) / sabakNums.length : 0;
    const lastGoal = num(rows[0]?.weeklyGoal);
    return { totalDays: rows.length, avgSabak, lastGoal };
  }, [rows]);

  if (checking) {
    return (
      <main className="min-h-screen">
        <FancyBg />
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="rounded-3xl border bg-white/70 p-8">Loading…</div>
        </div>
      </main>
    );
  }

  if (!me || !isAdmin) {
    return (
      <main className="min-h-screen">
        <FancyBg />
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="rounded-3xl border bg-white/70 p-10">
            <h1 className="text-3xl font-semibold">Not allowed</h1>
            <p className="mt-3 text-gray-700">Admin access only.</p>
            <div className="mt-6">
              <Link href="/admin" className="underline">
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-gray-900">
      <FancyBg />

      <header className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <div className="text-sm text-gray-600">Student Overview</div>
          <div className="text-xl font-semibold truncate">
            {studentEmail || "Student"}
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/admin/student/${studentUid}`}
            className="h-11 px-5 rounded-full bg-black text-white grid place-items-center text-sm"
          >
            Log Work
          </Link>
          <Link
            href="/admin"
            className="h-11 px-5 rounded-full border bg-white/70 grid place-items-center text-sm"
          >
            Back
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Days logged" value={String(summary.totalDays)} />
          <StatCard label="Average Sabak" value={summary.avgSabak ? summary.avgSabak.toFixed(1) : "—"} />
          <StatCard label="Latest weekly goal" value={summary.lastGoal ? String(summary.lastGoal) : "—"} />
        </div>

        <div className="rounded-3xl border bg-white/70 shadow-sm overflow-hidden">
          <div className="p-6 border-b flex flex-wrap gap-3 justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Full history</h2>
              <p className="text-gray-700 mt-1">
                Weekly goal completion shows duration when marked complete.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge>Admin</Badge>
              <Badge>Newest → Oldest</Badge>
              <Badge>Goal duration</Badge>
            </div>
          </div>

          <div className="p-6 overflow-x-auto">
            {loadingRows ? (
              <div>Loading logs…</div>
            ) : (
              <table className="min-w-[980px] w-full">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-gray-500">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Sabak</th>
                    <th className="pb-3 pr-4">Sabak Dhor</th>
                    <th className="pb-3 pr-4">SD Mistakes</th>
                    <th className="pb-3 pr-4">Dhor</th>
                    <th className="pb-3 pr-4">D Mistakes</th>
                    <th className="pb-3 pr-4">Weekly Goal</th>
                    <th className="pb-3">Goal Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {rows.map((r) => {
                    const completedDays = Number(r.goalCompletedInDays || 0);

                    return (
                      <tr key={r.id} className="text-sm">
                        <td className="py-4 pr-4 font-medium">
                          {r.dateKey ?? r.id}
                        </td>

                        <td className="py-4 pr-4">{toText(r.sabak) || "—"}</td>
                        <td className="py-4 pr-4">{toText(r.sabakDhor) || "—"}</td>

                        <td className="py-4 pr-4">
                          <MistakePill value={toText(r.sabakDhorMistakes)} isBad={num(r.sabakDhorMistakes) > 4} />
                        </td>

                        <td className="py-4 pr-4">{toText(r.dhor) || "—"}</td>

                        <td className="py-4 pr-4">
                          <MistakePill value={toText(r.dhorMistakes)} isBad={num(r.dhorMistakes) >= 3} />
                        </td>

                        <td className="py-4 pr-4">{toText(r.weeklyGoal) || "—"}</td>

                        <td className="py-4">
                          {completedDays > 0 ? (
                            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              Completed in {completedDays} days
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">In progress</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- UI bits ---------------- */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border bg-white/70 p-6 shadow-sm">
      <div className="text-xs uppercase tracking-widest text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function FancyBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
    </div>
  );
}
