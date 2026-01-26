"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

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

function toText(v: unknown) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v : String(v);
}

function parseDateKey(dateKey: string) {
  // dateKey = YYYY-MM-DD
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  // use UTC to avoid timezone issues
  return new Date(Date.UTC(y, m - 1, d));
}

function diffDaysInclusive(startDateKey: string, endDateKey: string) {
  const a = parseDateKey(startDateKey).getTime();
  const b = parseDateKey(endDateKey).getTime();
  const days = Math.floor((b - a) / (1000 * 60 * 60 * 24));
  // inclusive (same day => 1)
  return Math.max(1, days + 1);
}

export default function AdminStudentPage() {
  const params = useParams<{ uid: string }>();
  const studentUid = params.uid;
  const router = useRouter();

  const [me, setMe] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [studentEmail, setStudentEmail] = useState<string>("");

  const [sabak, setSabak] = useState("");
  const [sabakDhor, setSabakDhor] = useState("");
  const [dhor, setDhor] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [sabakDhorMistakes, setSabakDhorMistakes] = useState("");
  const [dhorMistakes, setDhorMistakes] = useState("");

  // ✅ NEW weekly goal tracking
  const [weeklyGoalSetDateKey, setWeeklyGoalSetDateKey] = useState<string>("");
  const [goalCompleted, setGoalCompleted] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dateKey = useMemo(() => getDateKeySA(), []);

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
      // student profile
      const sDoc = await getDoc(doc(db, "users", studentUid));
      if (sDoc.exists()) {
        const data = sDoc.data() as any;
        setStudentEmail(toText(data.email));
        setWeeklyGoal(toText(data.weeklyGoal));
        setWeeklyGoalSetDateKey(toText(data.weeklyGoalSetDateKey));
        setSabak(toText(data.currentSabak));
        setSabakDhor(toText(data.currentSabakDhor));
        setDhor(toText(data.currentDhor));
        setSabakDhorMistakes(toText(data.currentSabakDhorMistakes));
        setDhorMistakes(toText(data.currentDhorMistakes));
      }

      // today's log (override if exists)
      const todayDoc = await getDoc(doc(db, "users", studentUid, "logs", dateKey));
      if (todayDoc.exists()) {
        const d = todayDoc.data() as any;
        setSabak(toText(d.sabak));
        setSabakDhor(toText(d.sabakDhor));
        setDhor(toText(d.dhor));
        setWeeklyGoal(toText(d.weeklyGoal));
        setSabakDhorMistakes(toText(d.sabakDhorMistakes));
        setDhorMistakes(toText(d.dhorMistakes));
        setGoalCompleted(Boolean(d.goalCompleted));
      } else {
        setGoalCompleted(false);
      }
    }

    if (studentUid) loadStudent();
  }, [studentUid, dateKey]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setMsg(null);

    try {
      // if weekly goal is being set for the first time, store start date
      const goalSetKey = weeklyGoalSetDateKey || dateKey;

      // if admin ticked completed, compute duration
      const completedInDays =
        goalCompleted && goalSetKey ? diffDaysInclusive(goalSetKey, dateKey) : null;

      // 1) daily log
      await setDoc(
        doc(db, "users", studentUid, "logs", dateKey),
        {
          dateKey,
          createdAt: serverTimestamp(),
          sabak,
          sabakDhor,
          dhor,
          weeklyGoal,
          sabakDhorMistakes,
          dhorMistakes,

          // ✅ NEW weekly goal completion fields
          weeklyGoalSetDateKey: goalSetKey,
          goalCompleted,
          goalCompletedDateKey: goalCompleted ? dateKey : null,
          goalCompletedInDays: goalCompleted ? completedInDays : null,
          goalCompletedAt: goalCompleted ? serverTimestamp() : null,

          updatedBy: me?.uid ?? null,
          updatedByEmail: me?.email ?? null,
        },
        { merge: true }
      );

      // 2) snapshot on user doc
      await setDoc(
        doc(db, "users", studentUid),
        {
          weeklyGoal,
          weeklyGoalSetDateKey: goalSetKey,

          // keep “current” snapshot for student UI
          currentSabak: sabak,
          currentSabakDhor: sabakDhor,
          currentDhor: dhor,
          currentSabakDhorMistakes: sabakDhorMistakes,
          currentDhorMistakes: dhorMistakes,

          // ✅ NEW completion snapshot
          weeklyGoalCompleted: goalCompleted,
          weeklyGoalCompletedDateKey: goalCompleted ? dateKey : null,
          weeklyGoalCompletedInDays: goalCompleted ? completedInDays : null,
          weeklyGoalCompletedAt: goalCompleted ? serverTimestamp() : null,

          updatedAt: serverTimestamp(),
          lastUpdatedBy: me?.uid ?? null,
        },
        { merge: true }
      );

      setWeeklyGoalSetDateKey(goalSetKey);

      setMsg(
        goalCompleted && completedInDays
          ? `Saved ✅ (Goal completed in ${completedInDays} days)`
          : "Saved ✅"
      );
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg(err?.message ? `Error: ${err.message}` : "Error saving.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen p-10">
        <div className="rounded-2xl border p-6">Loading…</div>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen p-10">
        <div className="rounded-2xl border p-6">
          <div className="text-xl font-semibold">Please sign in</div>
          <div className="mt-3">
            <Link className="underline" href="/login">
              Go to login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen p-10">
        <div className="rounded-2xl border p-6">
          <div className="text-xl font-semibold">Not allowed</div>
          <p className="mt-2 text-gray-600">You are not an admin.</p>
          <div className="mt-4 flex gap-3">
            <Link className="underline" href="/">
              Home
            </Link>
            <Link className="underline" href="/admin">
              Admin
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-sm text-gray-600">Admin → Student</div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Log work for {studentEmail || "student"}
              </h1>
              <p className="mt-2 text-gray-700">
                Submitting for <span className="font-semibold">{dateKey}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                className="h-10 px-4 rounded-full border border-gray-200 bg-white/70 hover:bg-white grid place-items-center text-sm"
                href="/admin"
              >
                Back
              </Link>
              <button
                onClick={() => router.push(`/admin/student/${studentUid}/overview`)}
                className="h-10 px-4 rounded-full bg-black text-white hover:bg-gray-900 text-sm font-semibold"
              >
                Student Overview
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-6 grid gap-4">
            <Field label="Sabak" value={sabak} setValue={setSabak} hint="Example: 2 pages / 1 ruku / 5 lines" />
            <Field label="Sabak Dhor" value={sabakDhor} setValue={setSabakDhor} hint="Revision for current sabak" />
            <Field label="Sabak Dhor Mistakes" value={sabakDhorMistakes} setValue={setSabakDhorMistakes} hint="Number of mistakes" />
            <Field label="Dhor" value={dhor} setValue={setDhor} hint="Older revision" />
            <Field label="Dhor Mistakes" value={dhorMistakes} setValue={setDhorMistakes} hint="Number of mistakes" />
            <Field label="Weekly Sabak Goal" value={weeklyGoal} setValue={setWeeklyGoal} hint="Example: 10 pages" />

            {/* ✅ NEW: goal completion tick */}
            <label className="mt-2 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white/70 px-4 py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Weekly goal completed</div>
                <div className="text-xs text-gray-600">
                  Tick this when the student finishes the weekly sabak goal.
                  {weeklyGoalSetDateKey ? ` (Started: ${weeklyGoalSetDateKey})` : ""}
                </div>
              </div>
              <input
                type="checkbox"
                checked={goalCompleted}
                onChange={(e) => setGoalCompleted(e.target.checked)}
                className="h-5 w-5 accent-black"
              />
            </label>

            <div className="pt-2 flex items-center justify-between gap-4">
              <button
                disabled={saving}
                className="h-12 px-7 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save for student"}
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
