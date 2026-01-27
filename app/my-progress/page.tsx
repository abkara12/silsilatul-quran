/* app/my-progress/page.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

/* ---------------- helpers ---------------- */
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
  return `${y}-${m}-${d}`; // YYYY-MM-DD
}

function parseDateKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

// ISO week key like "2026-W05"
function isoWeekKeyFromDateKey(dateKey: string) {
  const d = parseDateKey(dateKey);
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (date.getDay() + 6) % 7; // Mon=0..Sun=6
  date.setDate(date.getDate() - day + 3); // Thu of current week

  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);

  const weekNo =
    1 +
    Math.round(
      (date.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

  const year = date.getFullYear();
  const ww = String(weekNo).padStart(2, "0");
  return `${year}-W${ww}`;
}

function toText(v: unknown) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v : String(v);
}

// numeric parse: accepts string/number/unknown safely
function num(v: unknown) {
  const s = toText(v).trim();
  if (!s) return 0;
  const m = s.replace(",", ".").match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur">
      {children}
    </span>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/70 px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900 break-words">{value}</div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function MyProgressPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [sabak, setSabak] = useState("");
  const [sabakDhor, setSabakDhor] = useState("");
  const [dhor, setDhor] = useState("");

  // mistakes
  const [sabakDhorMistakes, setSabakDhorMistakes] = useState("");
  const [dhorMistakes, setDhorMistakes] = useState("");

  // Weekly goal meta (same fields as ustad uses, but student cannot complete)
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [weeklyGoalWeekKey, setWeeklyGoalWeekKey] = useState("");
  const [weeklyGoalStartDateKey, setWeeklyGoalStartDateKey] = useState("");
  const [weeklyGoalCompletedDateKey, setWeeklyGoalCompletedDateKey] = useState("");
  const [weeklyGoalDurationDays, setWeeklyGoalDurationDays] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const dateKey = useMemo(() => getDateKeySA(), []);
  const currentWeekKey = useMemo(() => isoWeekKeyFromDateKey(dateKey), [dateKey]);

  const goalNum = useMemo(() => num(weeklyGoal), [weeklyGoal]);
  const sabakNum = useMemo(() => num(sabak), [sabak]);

  const goalReachedToday = goalNum > 0 && sabakNum >= goalNum;

  // lock weekly goal edits if already set for this week
  const goalLockedThisWeek =
    weeklyGoal.trim().length > 0 && weeklyGoalWeekKey === currentWeekKey;

  const goalAlreadyCompleted =
    Boolean(weeklyGoalCompletedDateKey) || (weeklyGoalDurationDays ?? 0) > 0;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoadingUser(false);

      if (!u) return;

      // Load latest snapshot (users/{uid})
      const snapRef = doc(db, "users", u.uid);
      const snap = await getDoc(snapRef);
      if (snap.exists()) {
        const data = snap.data() as any;

        setSabak(toText(data.currentSabak));
        setSabakDhor(toText(data.currentSabakDhor));
        setDhor(toText(data.currentDhor));
        setSabakDhorMistakes(toText(data.currentSabakDhorMistakes));
        setDhorMistakes(toText(data.currentDhorMistakes));

        // weekly meta
        setWeeklyGoal(toText(data.weeklyGoal));
        setWeeklyGoalWeekKey(toText(data.weeklyGoalWeekKey));
        setWeeklyGoalStartDateKey(toText(data.weeklyGoalStartDateKey));
        setWeeklyGoalCompletedDateKey(toText(data.weeklyGoalCompletedDateKey));

        const dur = (data as any).weeklyGoalDurationDays;
        setWeeklyGoalDurationDays(
          typeof dur === "number" ? dur : dur ? Number(dur) : null
        );
      }

      // Load today's log if exists (users/{uid}/logs/{dateKey})
      const todayRef = doc(db, "users", u.uid, "logs", dateKey);
      const today = await getDoc(todayRef);
      if (today.exists()) {
        const d = today.data() as any;
        setSabak(toText(d.sabak));
        setSabakDhor(toText(d.sabakDhor));
        setDhor(toText(d.dhor));
        setSabakDhorMistakes(toText(d.sabakDhorMistakes));
        setDhorMistakes(toText(d.dhorMistakes));

        // Keep weekly goal from snapshot unless it exists on today log
        if (toText(d.weeklyGoal)) setWeeklyGoal(toText(d.weeklyGoal));
      }
    });

    return () => unsub();
  }, [dateKey]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSavedMsg(null);

    try {
      // -------- Weekly goal logic (student can set once per week, cannot complete) --------
      let nextGoal = weeklyGoal.trim();
      let nextWeekKey = weeklyGoalWeekKey;
      let nextStartKey = weeklyGoalStartDateKey;

      // Keep completion fields from existing state (these are set by ustad/admin)
      const nextCompletedKey = weeklyGoalCompletedDateKey || "";
      const nextDuration = weeklyGoalDurationDays ?? null;

      if (nextGoal) {
        // If new week or never set → allow setting (and set start date)
        const isNewWeekGoal = !nextWeekKey || nextWeekKey !== currentWeekKey;

        if (isNewWeekGoal) {
          nextWeekKey = currentWeekKey;
          nextStartKey = dateKey;
          // DO NOT clear completed meta here (ustad controls completion),
          // but typically completion belongs to that goal; if you want strict reset each week, uncomment:
          // nextCompletedKey = "";
          // nextDuration = null;
        } else {
          // same week → lock edits
          // If they tried changing, just keep current value (goalLockedThisWeek disables input anyway)
        }
      }

      const logRef = doc(db, "users", user.uid, "logs", dateKey);

      // 1) Daily history log (one doc per day)
      await setDoc(
        logRef,
        {
          dateKey,
          createdAt: serverTimestamp(),
          sabak,
          sabakDhor,
          dhor,

          sabakDhorMistakes,
          dhorMistakes,

          // weekly snapshot for the day
          weeklyGoal: nextGoal,
          weeklyGoalWeekKey: nextWeekKey || null,
          weeklyGoalStartDateKey: nextStartKey || null,
          weeklyGoalCompletedDateKey: nextCompletedKey || null,
          weeklyGoalDurationDays: nextDuration,
          weeklyGoalCompleted: Boolean(nextCompletedKey),
        },
        { merge: true }
      );

      // 2) Snapshot on user doc
      await setDoc(
        doc(db, "users", user.uid),
        {
          weeklyGoal: nextGoal,
          weeklyGoalWeekKey: nextWeekKey || null,
          weeklyGoalStartDateKey: nextStartKey || null,
          weeklyGoalCompletedDateKey: nextCompletedKey || null,
          weeklyGoalDurationDays: nextDuration,

          currentSabak: sabak,
          currentSabakDhor: sabakDhor,
          currentDhor: dhor,

          currentSabakDhorMistakes: sabakDhorMistakes,
          currentDhorMistakes: dhorMistakes,

          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // reflect local
      setWeeklyGoal(nextGoal);
      setWeeklyGoalWeekKey(nextWeekKey || "");
      setWeeklyGoalStartDateKey(nextStartKey || "");

      setSavedMsg("Saved for today ✅");
      setTimeout(() => setSavedMsg(null), 3500);
    } catch (err: any) {
      setSavedMsg(err?.message ? `Error: ${err.message}` : "Error saving.");
    } finally {
      setSaving(false);
    }
  }

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
              You need to be signed in to submit your daily progress.
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

      <header className="max-w-6xl mx-auto px-6 sm:px-10 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-black text-white grid place-items-center shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M7 4h10a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 012-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-600">My Progress</div>
            <div className="text-xl font-semibold tracking-tight">Daily Submission</div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <Badge>Today: {dateKey}</Badge>
          <Link
            href="/overview"
            className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-gray-300 bg-white/60 backdrop-blur text-sm font-medium hover:bg-white"
          >
            View Overview
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-16">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* left: form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <p className="uppercase tracking-widest text-xs text-[#9c7c38]">
                      Submit for {dateKey}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                      Enter today’s Hifz work
                    </h1>
                    <p className="mt-3 text-gray-700">
                      Record your Sabak, Sabak Dhor, Dhor, mistakes, and weekly goal.
                      This saves into your personal history table.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border ${
                        goalAlreadyCompleted
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : goalReachedToday
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-white/60 text-gray-700"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          goalAlreadyCompleted || goalReachedToday ? "bg-emerald-500" : "bg-[#9c7c38]"
                        }`}
                      />
                      {goalAlreadyCompleted
                        ? `Goal completed in ${weeklyGoalDurationDays ?? "—"} day(s)`
                        : goalNum > 0
                        ? goalReachedToday
                          ? "Goal reached (today)"
                          : "Working toward goal"
                        : "Set a weekly goal"}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="p-8 grid gap-5">
                <Field
                  label="Sabak"
                  hint="Example: 2 pages / 1 ruku / 5 lines"
                  value={sabak}
                  setValue={setSabak}
                />
                <Field
                  label="Sabak Dhor"
                  hint="Revision for your current sabak"
                  value={sabakDhor}
                  setValue={setSabakDhor}
                />
                <Field
                  label="Sabak Dhor Mistakes"
                  hint="Number of mistakes in sabak dhor today"
                  value={sabakDhorMistakes}
                  setValue={setSabakDhorMistakes}
                />
                <Field
                  label="Dhor"
                  hint="Older revision / strong retention"
                  value={dhor}
                  setValue={setDhor}
                />
                <Field
                  label="Dhor Mistakes"
                  hint="Number of mistakes in dhor today"
                  value={dhorMistakes}
                  setValue={setDhorMistakes}
                />

                {/* Weekly goal block (student version: no completion toggle) */}
                <div className="rounded-3xl border border-gray-200 bg-white/70 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Weekly Goal</div>
                      <div className="mt-1 text-sm text-gray-700">
                        You can set this <span className="font-semibold">once per week</span>.
                        Ustad will mark it completed when you finish.
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      Week: <span className="font-semibold">{currentWeekKey}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <label className="grid gap-2">
                      <div className="flex items-end justify-between gap-4">
                        <span className="text-sm font-semibold text-gray-900">Weekly Sabak Goal</span>
                        <span className="text-xs text-gray-500">
                          {goalLockedThisWeek ? "Locked (already set this week)" : "Set it now"}
                        </span>
                      </div>

                      <input
                        value={weeklyGoal}
                        onChange={(e) => setWeeklyGoal(e.target.value)}
                        disabled={goalLockedThisWeek}
                        className="h-12 rounded-2xl border border-gray-200 bg-white/80 px-4 outline-none focus:ring-2 focus:ring-[#9c7c38]/30 disabled:opacity-60"
                        placeholder="Example: 10 pages"
                      />
                    </label>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <MiniInfo label="Started" value={weeklyGoalStartDateKey || "—"} />
                      <MiniInfo label="Completed" value={weeklyGoalCompletedDateKey || "—"} />
                      <MiniInfo
                        label="Duration"
                        value={weeklyGoalDurationDays ? `${weeklyGoalDurationDays} day(s)` : "—"}
                      />
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white/70 px-4 py-4">
                      <div className="text-sm font-semibold text-gray-900">Completion</div>
                      <div className="mt-1 text-xs text-gray-600">
                        Only Ustad can mark the weekly goal as completed.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <button
                    disabled={saving}
                    type="submit"
                    className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save Today"}
                  </button>

                  <div className="flex items-center gap-3">
                    {savedMsg ? (
                      <span className="text-sm text-gray-700">{savedMsg}</span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Your entries are private to your account.
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:hidden mt-2">
                  <Link
                    href="/overview"
                    className="inline-flex items-center justify-center h-11 w-full rounded-full border border-gray-300 bg-white/60 backdrop-blur text-sm font-medium hover:bg-white"
                  >
                    View Overview
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* right: tips + preview */}
          <div className="lg:col-span-5 grid gap-6">
            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur p-8 shadow-lg">
              <p className="uppercase tracking-widest text-xs text-[#9c7c38]">Tip</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">Keep entries consistent</h3>
              <p className="mt-3 text-gray-700 leading-relaxed">
                For best tracking, try to use the same unit (pages/lines/ruku) each day.
                The goal indicator reads the first number you type.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Badge>Private</Badge>
                <Badge>Saved daily</Badge>
                <Badge>Shows in table</Badge>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-black text-white p-8 shadow-xl relative overflow-hidden">
              <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#9c7c38]/25 blur-2xl" />
              <p className="text-sm uppercase tracking-widest text-white/70">Weekly Goal</p>
              <h3 className="mt-2 text-2xl font-semibold">Progress Indicator</h3>
              <p className="mt-3 text-white/70 leading-relaxed">
                Goal: <span className="text-white">{goalNum || 0}</span> • Today’s Sabak:{" "}
                <span className="text-white">{sabakNum || 0}</span>
              </p>

              <div className="mt-5">
                <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/80"
                    style={{
                      width:
                        goalNum > 0
                          ? `${Math.min(100, (sabakNum / goalNum) * 100)}%`
                          : "0%",
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-white/60">
                  {goalNum > 0
                    ? `${Math.min(100, Math.round((sabakNum / goalNum) * 100))}%`
                    : "Set a weekly goal to see progress"}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-sm">
              <h3 className="text-lg font-semibold tracking-tight">Quick links</h3>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/overview"
                  className="rounded-2xl border border-gray-200 bg-white/70 px-4 py-4 text-sm font-medium text-gray-900 hover:bg-white transition-colors"
                >
                  View my history table →
                </Link>
                <Link
                  href="/"
                  className="rounded-2xl border border-gray-200 bg-white/70 px-4 py-4 text-sm font-medium text-gray-900 hover:bg-white transition-colors"
                >
                  Back to home →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- UI bits ---------------- */
function Field({
  label,
  hint,
  value,
  setValue,
}: {
  label: string;
  hint: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <div className="flex items-end justify-between gap-4">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <span className="text-xs text-gray-500">{hint}</span>
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-12 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur px-4 text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-[#9c7c38]/30"
        placeholder="Type here…"
      />
    </label>
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
