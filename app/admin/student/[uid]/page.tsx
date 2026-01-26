"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

/** South Africa date key YYYY-MM-DD */
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

/** Week key = Monday of this week (Africa/Johannesburg) */
function getWeekKeySA() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = Number(parts.find((p) => p.type === "year")?.value ?? "1970");
  const m = Number(parts.find((p) => p.type === "month")?.value ?? "01");
  const d = Number(parts.find((p) => p.type === "day")?.value ?? "01");

  // Use UTC to avoid timezone surprises
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0=Sun..6=Sat
  const diffToMon = (day + 6) % 7; // 0 if Mon, 6 if Sun
  dt.setUTCDate(dt.getUTCDate() - diffToMon);

  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`; // Monday date
}

function toText(v: unknown) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v : String(v);
}

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function AdminStudentPage() {
  const params = useParams<{ uid: string }>();
  const studentUid = params.uid;
  const router = useRouter();

  const [me, setMe] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [studentEmail, setStudentEmail] = useState("");

  const [sabak, setSabak] = useState("");
  const [sabakDhor, setSabakDhor] = useState("");
  const [dhor, setDhor] = useState("");
  const [sabakDhorMistakes, setSabakDhorMistakes] = useState("");
  const [dhorMistakes, setDhorMistakes] = useState("");

  // ✅ Weekly goal: locked once per week
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [goalWeekKey, setGoalWeekKey] = useState<string>("");
  const [goalSetAt, setGoalSetAt] = useState<Date | null>(null);
  const [goalCompletedAt, setGoalCompletedAt] = useState<Date | null>(null);
  const [goalDaysToComplete, setGoalDaysToComplete] = useState<number | null>(null);
  const [markGoalComplete, setMarkGoalComplete] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dateKey = useMemo(() => getDateKeySA(), []);
  const weekKey = useMemo(() => getWeekKeySA(), []);

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
    async function loadStudent() {
      // Student profile (snapshot)
      const sDoc = await getDoc(doc(db, "users", studentUid));
      if (sDoc.exists()) {
        const data = sDoc.data() as any;
        setStudentEmail(toText(data.email));

        // ✅ Weekly goal object
        const wg = data.weeklyGoalState || null;
        if (wg) {
          setWeeklyGoal(toText(wg.target));
          setGoalWeekKey(toText(wg.weekKey));
          setGoalSetAt(wg.setAt?.toDate ? wg.setAt.toDate() : null);
          setGoalCompletedAt(wg.completedAt?.toDate ? wg.completedAt.toDate() : null);
          setGoalDaysToComplete(typeof wg.daysToComplete === "number" ? wg.daysToComplete : null);
        }
      }

      // Today log overrides if exists
      const todayDoc = await getDoc(doc(db, "users", studentUid, "logs", dateKey));
      if (todayDoc.exists()) {
        const d = todayDoc.data() as any;
        setSabak(toText(d.sabak));
        setSabakDhor(toText(d.sabakDhor));
        setDhor(toText(d.dhor));
        setSabakDhorMistakes(toText(d.sabakDhorMistakes));
        setDhorMistakes(toText(d.dhorMistakes));
      }
    }

    if (studentUid) loadStudent();
  }, [studentUid, dateKey]);

  const weeklyGoalLocked = useMemo(() => {
    // Locked if goalWeekKey is this week AND weeklyGoal already exists
    return goalWeekKey === weekKey && weeklyGoal.trim().length > 0;
  }, [goalWeekKey, weekKey, weeklyGoal]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setMsg(null);

    try {
      // ✅ Weekly goal rules
      // If goal already set this week, do NOT allow changing the text.
      let weeklyGoalToSave = weeklyGoal.trim();
      let goalStateUpdate: any = null;

      // Read current user doc again to be safe
      const sDoc = await getDoc(doc(db, "users", studentUid));
      const existing = sDoc.exists() ? (sDoc.data() as any).weeklyGoalState : null;

      const existingWeekKey = toText(existing?.weekKey);
      const existingTarget = toText(existing?.target);

      // If already set this week and target exists, lock it
      if (existingWeekKey === weekKey && existingTarget) {
        weeklyGoalToSave = existingTarget;
      } else {
        // New week (or empty target) → allow set once
        if (weeklyGoalToSave) {
          goalStateUpdate = {
            weeklyGoalState: {
              weekKey,
              target: weeklyGoalToSave,
              setAt: serverTimestamp(),
              completedAt: null,
              daysToComplete: null,
            },
          };
        }
      }

      // ✅ Goal completion
      // Only allow marking complete if goal exists and is NOT already completed
      if (markGoalComplete) {
        const setAtDate =
          existing?.setAt?.toDate ? existing.setAt.toDate() : goalSetAt;

        if (setAtDate && weeklyGoalToSave) {
          const days = daysBetween(setAtDate, new Date());
          goalStateUpdate = {
            ...(goalStateUpdate || {}),
            weeklyGoalState: {
              weekKey: existingWeekKey || weekKey,
              target: weeklyGoalToSave,
              setAt: existing?.setAt ?? serverTimestamp(),
              completedAt: serverTimestamp(),
              daysToComplete: days,
            },
          };
        }
      }

      // 1) Daily log
      await setDoc(
        doc(db, "users", studentUid, "logs", dateKey),
        {
          dateKey,
          createdAt: serverTimestamp(),
          sabak,
          sabakDhor,
          dhor,
          sabakDhorMistakes,
          dhorMistakes,
          updatedBy: me?.uid ?? null,
          updatedByEmail: me?.email ?? null,
        },
        { merge: true }
      );

      // 2) Snapshot on user doc
      await setDoc(
        doc(db, "users", studentUid),
        {
          currentSabak: sabak,
          currentSabakDhor: sabakDhor,
          currentDhor: dhor,
          currentSabakDhorMistakes: sabakDhorMistakes,
          currentDhorMistakes: dhorMistakes,
          updatedAt: serverTimestamp(),
          lastUpdatedBy: me?.uid ?? null,

          ...(goalStateUpdate || {}),
        },
        { merge: true }
      );

      // UI state updates
      if (goalStateUpdate?.weeklyGoalState?.weekKey) setGoalWeekKey(goalStateUpdate.weeklyGoalState.weekKey);
      setMsg("Saved ✅");
      setTimeout(() => setMsg(null), 2500);
      setMarkGoalComplete(false);
    } catch (err: any) {
      setMsg(err?.message ? `Error: ${err.message}` : "Error saving.");
    } finally {
      setSaving(false);
    }
  }

  // ✅ Smooth loading: never show "not admin" until auth is done
  if (checking) {
    return (
      <main className="min-h-screen text-gray-900">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-sm">
            <div className="h-4 w-28 rounded-full bg-black/10 animate-pulse" />
            <div className="mt-4 h-8 w-72 rounded-2xl bg-black/10 animate-pulse" />
            <div className="mt-3 h-4 w-full rounded-full bg-black/10 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen text-gray-900">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Please sign in</h1>
            <div className="mt-5">
              <Link
                className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900"
                href="/login"
              >
                Go to login
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen text-gray-900">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Not allowed</h1>
            <p className="mt-2 text-gray-700">You are not an admin.</p>
            <div className="mt-6 flex gap-3">
              <Link className="underline" href="/">Home</Link>
              <Link className="underline" href="/admin">Admin</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-gray-900">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
        <div className="absolute -top-56 left-[-10%] h-[780px] w-[780px] rounded-full bg-[#9c7c38]/25 blur-3xl" />
        <div className="absolute top-[-25%] right-[-15%] h-[900px] w-[900px] rounded-full bg-black/15 blur-3xl" />
        <div className="absolute -bottom-72 left-[20%] h-[980px] w-[980px] rounded-full bg-[#9c7c38]/18 blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="text-sm text-gray-600">Ustad → Student</div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Log work for {studentEmail || "student"}
              </h1>
              <p className="mt-2 text-gray-700">
                Submitting for <span className="font-semibold">{dateKey}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
                href="/admin"
              >
                Back
              </Link>
              <button
                onClick={() => router.push(`/admin/student/${studentUid}/overview`)}
                className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-black text-white hover:bg-gray-900 text-sm font-semibold"
              >
                View overview
              </button>
            </div>
          </div>

          {/* Weekly goal card */}
          <div className="mt-8 rounded-3xl border border-gray-200 bg-white/70 p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-sm font-semibold text-gray-900">Weekly Goal</div>
                <div className="mt-1 text-sm text-gray-600">
                  Week starts: <span className="font-medium text-gray-800">{weekKey}</span>
                </div>
              </div>

              {goalCompletedAt ? (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border border-gray-200 bg-white/70 text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-[#9c7c38]" />
                  In progress
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <div className="flex items-end justify-between">
                  <span className="text-sm font-semibold text-gray-900">Goal</span>
                  {weeklyGoalLocked ? (
                    <span className="text-xs text-gray-500">Locked for this week</span>
                  ) : (
                    <span className="text-xs text-gray-500">Set once per week</span>
                  )}
                </div>

                <input
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(e.target.value)}
                  disabled={weeklyGoalLocked}
                  className="h-12 rounded-2xl border border-gray-200 bg-white/80 px-4 outline-none focus:ring-2 focus:ring-[#9c7c38]/30 disabled:opacity-70"
                  placeholder='Example: "10 pages"'
                />
              </label>

              {goalDaysToComplete ? (
                <div className="text-sm text-gray-700">
                  ✅ Completed in{" "}
                  <span className="font-semibold">{goalDaysToComplete}</span>{" "}
                  day(s).
                </div>
              ) : null}

              {!goalCompletedAt && weeklyGoal.trim() ? (
                <label className="flex items-center gap-3 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={markGoalComplete}
                    onChange={(e) => setMarkGoalComplete(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Mark weekly goal as completed
                </label>
              ) : null}
            </div>
          </div>

          {/* Daily log form */}
          <form onSubmit={handleSave} className="mt-8 grid gap-4">
            <Field label="Sabak" value={sabak} setValue={setSabak} hint="Example: 2 pages / 1 ruku / 5 lines" />
            <Field label="Sabak Dhor" value={sabakDhor} setValue={setSabakDhor} hint="Revision for current sabak" />
            <Field label="Sabak Dhor Mistakes" value={sabakDhorMistakes} setValue={setSabakDhorMistakes} hint="Number of mistakes" />
            <Field label="Dhor" value={dhor} setValue={setDhor} hint="Older revision" />
            <Field label="Dhor Mistakes" value={dhorMistakes} setValue={setDhorMistakes} hint="Number of mistakes" />

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <button
                disabled={saving}
                className="h-12 px-7 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <div className="text-sm text-gray-700">{msg ?? ""}</div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

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
        className="h-12 rounded-2xl border border-gray-200 bg-white/80 px-4 outline-none focus:ring-2 focus:ring-[#9c7c38]/30"
        placeholder="Type here…"
      />
    </label>
  );
}
