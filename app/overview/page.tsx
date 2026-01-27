/* app/overview/page.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

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

  // weekly goal meta
  weeklyGoalWeekKey?: string;
  weeklyGoalStartDateKey?: string;
  weeklyGoalCompletedDateKey?: string;
  weeklyGoalDurationDays?: number | string | null;
  weeklyGoalCompleted?: boolean | string | number;
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

function Cell({ children, subtle }: { children: React.ReactNode; subtle?: boolean }) {
  return (
    <div
      className={[
        "rounded-2xl border px-3 py-2",
        subtle
          ? "border-gray-200 bg-white/50 text-gray-700"
          : "border-gray-200 bg-white/70 text-gray-900",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function GoalPill({
  status,
  extra,
}: {
  status: "completed" | "in_progress" | "none";
  extra?: string;
}) {
  if (status === "none") {
    return <span className="text-xs text-gray-500">No goal set</span>;
  }

  const isCompleted = status === "completed";
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border",
        isCompleted
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", isCompleted ? "bg-emerald-500" : "bg-amber-500"].join(" ")} />
      {isCompleted ? "Completed" : "In progress"}
      {extra ? <span className="text-[11px] font-semibold opacity-80">• {extra}</span> : null}
    </span>
  );
}

/* ---------------- page ---------------- */
export default function OverviewPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [rows, setRows] = useState<LogRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoadingUser(false);
      if (!u) return;

      setLoadingRows(true);
      try {
        const data = await fetchLogs(u.uid);
        setRows(data);
      } finally {
        setLoadingRows(false);
      }
    });
    return () => unsub();
  }, []);

  const summary = useMemo(() => {
    if (!rows.length) return { totalDays: 0, avgSabak: 0, lastGoal: 0 };
    const sabakNums = rows.map((r) => num(r.sabak)).filter((n) => n > 0);
    const avgSabak =
      sabakNums.length ? sabakNums.reduce((a, b) => a + b, 0) / sabakNums.length : 0;
    const lastGoal = num(rows[0]?.weeklyGoal);
    return { totalDays: rows.length, avgSabak, lastGoal };
  }, [rows]);

  if (loadingUser) {
    return (
      <main className="min-h-screen">
        <FancyBg />
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
          <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-sm">
            Loading…
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen">
        <FancyBg />
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
          <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-10 shadow-sm">
            <h1 className="text-3xl font-semibold tracking-tight">Please sign in</h1>
            <p className="mt-3 text-gray-700">
              You need to be signed in to view your progress history.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-gray-300 bg-white/60 backdrop-blur text-sm font-medium hover:bg-white"
              >
                Enrol (Sign Up)
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

      <header className="max-w-6xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-black text-white grid place-items-center shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M8 7V4m8 3V4M5 11h14M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-600">Overview</div>
            <div className="text-xl font-semibold tracking-tight">Progress History</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/my-progress"
            className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-900"
          >
            Add Today’s Progress
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-gray-300 bg-white/60 backdrop-blur text-sm font-medium hover:bg-white"
          >
            Home
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-16">
        {/* Summary cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Days logged" value={String(summary.totalDays)} />
          <StatCard label="Average Sabak" value={summary.avgSabak ? summary.avgSabak.toFixed(1) : "—"} />
          <StatCard label="Latest weekly goal" value={summary.lastGoal ? String(summary.lastGoal) : "—"} />
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="uppercase tracking-widest text-xs text-[#9c7c38]">History table</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your daily logs</h2>
              <p className="mt-2 text-gray-700">
                Each day is saved as a separate entry. Weekly goal completion shows when Ustad marks it done.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge>Private</Badge>
              <Badge>Sorted newest → oldest</Badge>
              <Badge>Weekly goal tracking</Badge>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {loadingRows ? (
              <div className="text-gray-700">Loading logs…</div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-6">
                <div className="text-lg font-semibold">No logs yet</div>
                <p className="mt-2 text-gray-700">
                  Start by submitting your first day on the My Progress page.
                </p>
                <div className="mt-4">
                  <Link
                    href="/my-progress"
                    className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-900"
                  >
                    Go to My Progress
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-widest text-gray-500">
                      <th className="pb-3 pr-4">Date</th>

                      <th className="pb-3 pr-4 border-l border-gray-200 pl-4">Sabak</th>
                      <th className="pb-3 pr-4 border-l border-gray-200 pl-4">Sabak Dhor</th>
                      <th className="pb-3 pr-4 border-l border-gray-200 pl-4">Sabak Dhor Mistakes</th>

                      <th className="pb-3 pr-4 border-l border-gray-200 pl-4">Dhor</th>
                      <th className="pb-3 pr-4 border-l border-gray-200 pl-4">Dhor Mistakes</th>

                      <th className="pb-3 pr-4 border-l border-gray-200 pl-4">Weekly Goal</th>
                      <th className="pb-3 pr-4 border-l border-gray-200 pl-4">Goal Week</th>
                      <th className="pb-3 border-l border-gray-200 pl-4">Goal Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {rows.map((r) => {
                      const goal = toText(r.weeklyGoal);
                      const g = num(r.weeklyGoal);
                      const s = num(r.sabak);

                      const completed =
                        r.weeklyGoalCompleted === true ||
                        r.weeklyGoalCompleted === "true" ||
                        r.weeklyGoalCompleted === 1 ||
                        r.weeklyGoalCompleted === "1" ||
                        Boolean(toText(r.weeklyGoalCompletedDateKey));

                      const durationRaw = (r.weeklyGoalDurationDays ?? null) as any;
                      const duration =
                        typeof durationRaw === "number"
                          ? durationRaw
                          : durationRaw
                          ? Number(durationRaw)
                          : null;

                      const status: "completed" | "in_progress" | "none" =
                        goal && completed ? "completed" : goal ? "in_progress" : "none";

                      const extra =
                        status === "completed" && duration ? `${duration} day(s)` : undefined;

                      return (
                        <tr key={r.id} className="text-sm align-top">
                          <td className="py-4 pr-4 font-medium text-gray-900 whitespace-nowrap">
                            {r.dateKey ?? r.id}
                          </td>

                          <td className="py-4 pr-4 border-l border-gray-200 pl-4">
                            <Cell>{toText(r.sabak) || "—"}</Cell>
                          </td>

                          <td className="py-4 pr-4 border-l border-gray-200 pl-4">
                            <Cell>{toText(r.sabakDhor) || "—"}</Cell>
                          </td>

                          <td className="py-4 pr-4 border-l border-gray-200 pl-4">
                            <Cell subtle>{toText(r.sabakDhorMistakes) || "—"}</Cell>
                          </td>

                          <td className="py-4 pr-4 border-l border-gray-200 pl-4">
                            <Cell>{toText(r.dhor) || "—"}</Cell>
                          </td>

                          <td className="py-4 pr-4 border-l border-gray-200 pl-4">
                            <Cell subtle>{toText(r.dhorMistakes) || "—"}</Cell>
                          </td>

                          <td className="py-4 pr-4 border-l border-gray-200 pl-4">
                            <Cell>{goal || "—"}</Cell>
                          </td>

                          <td className="py-4 pr-4 border-l border-gray-200 pl-4">
                            <Cell subtle>{toText(r.weeklyGoalWeekKey) || "—"}</Cell>
                          </td>

                          <td className="py-4 border-l border-gray-200 pl-4">
                            {status === "none" ? (
                              <span className="text-xs text-gray-500">No goal set</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <GoalPill status={status} extra={extra} />
                                {/* optional: show "reached today" hint */}
                                {!completed && g > 0 && s >= g ? (
                                  <span className="text-xs font-semibold text-emerald-700">
                                    • reached today
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
    <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#9c7c38] via-[#9c7c38]/60 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#9c7c38]/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="text-xs uppercase tracking-widest text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{value}</div>
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
