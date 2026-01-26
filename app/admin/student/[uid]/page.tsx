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

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dateKey = useMemo(() => getDateKeySA(), []);

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
    async function loadStudent() {
      // student profile
      const sDoc = await getDoc(doc(db, "users", studentUid));
      if (sDoc.exists()) {
        const data = sDoc.data() as any;
        setStudentEmail(toText(data.email));
        setWeeklyGoal(toText(data.weeklyGoal));
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
          updatedBy: me?.uid ?? null,
          updatedByEmail: me?.email ?? null,
        },
        { merge: true }
      );

      // 2) snapshot
      await setDoc(
        doc(db, "users", studentUid),
        {
          weeklyGoal,
          currentSabak: sabak,
          currentSabakDhor: sabakDhor,
          currentDhor: dhor,
          currentSabakDhorMistakes: sabakDhorMistakes,
          currentDhorMistakes: dhorMistakes,
          updatedAt: serverTimestamp(),
          lastUpdatedBy: me?.uid ?? null,
        },
        { merge: true }
      );

      setMsg("Saved ✅");
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg(err?.message ? `Error: ${err.message}` : "Error saving.");
    } finally {
      setSaving(false);
    }
  }

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

      <div className="max-w-4xl mx-auto px-5 sm:px-10 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="text-sm text-gray-600">Admin → Student</div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
                Log work for {studentEmail || "student"}
              </h1>
              <p className="mt-2 text-gray-700">
                Submitting for <span className="font-semibold">{dateKey}</span>
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-xs text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-[#9c7c38]" />
                  No passwords needed
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-xs text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Admin only
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="h-11 px-5 rounded-full border border-gray-200 bg-white/70 hover:bg-white grid place-items-center text-sm font-semibold"
                href="/admin"
              >
                Back
              </Link>

              <Link
                className="h-11 px-5 rounded-full border border-gray-200 bg-white/70 hover:bg-white grid place-items-center text-sm font-semibold"
                href={`/admin/student/${studentUid}/overview`}
              >
                Student Overview →
              </Link>

              <button
                onClick={() => router.push(`/overview`)}
                className="h-11 px-5 rounded-full bg-black text-white hover:bg-gray-900 text-sm font-semibold"
              >
                My Overview
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-8 grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Sabak" value={sabak} setValue={setSabak} hint="e.g. 2 pages / 1 ruku / 5 lines" />
              <Field label="Weekly Sabak Goal" value={weeklyGoal} setValue={setWeeklyGoal} hint="e.g. 10 pages" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Sabak Dhor" value={sabakDhor} setValue={setSabakDhor} hint="Revision for current sabak" />
              <Field label="Sabak Dhor Mistakes" value={sabakDhorMistakes} setValue={setSabakDhorMistakes} hint="Number of mistakes" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Dhor" value={dhor} setValue={setDhor} hint="Older revision" />
              <Field label="Dhor Mistakes" value={dhorMistakes} setValue={setDhorMistakes} hint="Number of mistakes" />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <button
                disabled={saving}
                className="h-12 px-7 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save for student"}
              </button>

              <div className="text-sm">
                {msg ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-[#9c7c38]" />
                    {msg}
                  </span>
                ) : (
                  <span className="text-gray-600">Tip: Save updates the student’s overview too.</span>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-black text-white p-7 shadow-xl relative overflow-hidden">
          <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#9c7c38]/25 blur-2xl" />
          <div className="text-xs uppercase tracking-widest text-white/70">Quick note</div>
          <div className="mt-2 text-lg font-semibold">This page is phone-friendly</div>
          <div className="mt-2 text-white/75 text-sm leading-relaxed">
            On mobile, fields stack perfectly. On bigger screens, they align into neat columns.
          </div>
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
