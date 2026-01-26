"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

function toText(v: unknown) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v : String(v);
}

export default function AdminStudentOverviewPage() {
  const params = useParams<{ uid: string }>();
  const studentUid = params.uid;

  const [me, setMe] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [studentEmail, setStudentEmail] = useState("");
  const [weeklyGoalSummary, setWeeklyGoalSummary] = useState<string>("");

  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
    async function load() {
      setLoadingLogs(true);
      try {
        const sDoc = await getDoc(doc(db, "users", studentUid));
        if (sDoc.exists()) {
          const data = sDoc.data() as any;
          setStudentEmail(toText(data.email));

          const wg = data.weeklyGoalState;
          if (wg?.target) {
            const done = wg.daysToComplete
              ? `✅ Completed in ${wg.daysToComplete} day(s)`
              : wg.completedAt
              ? `✅ Completed`
              : `In progress`;
            setWeeklyGoalSummary(`${toText(wg.target)} • ${done}`);
          } else {
            setWeeklyGoalSummary("No weekly goal set yet");
          }
        }

        const q = query(
          collection(db, "users", studentUid, "logs"),
          orderBy("dateKey", "desc")
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map((d) => d.data()));
      } finally {
        setLoadingLogs(false);
      }
    }

    if (!checking && isAdmin && studentUid) load();
  }, [checking, isAdmin, studentUid]);

  if (checking) {
    return (
      <main className="min-h-screen text-gray-900">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
        </div>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-sm">
            <div className="h-6 w-48 rounded-2xl bg-black/10 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen p-10">
        <div className="rounded-2xl border p-6">
          <div className="text-xl font-semibold">Please sign in</div>
          <div className="mt-3">
            <Link className="underline" href="/login">Go to login</Link>
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
            <Link className="underline" href="/">Home</Link>
            <Link className="underline" href="/admin">Admin</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-gray-900">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
        <div className="absolute -top-56 left-[-10%] h-[780px] w-[780px] rounded-full bg-[#9c7c38]/25 blur-3xl" />
        <div className="absolute top-[-25%] right-[-15%] h-[900px] w-[900px] rounded-full bg-black/15 blur-3xl" />
        <div className="absolute -bottom-72 left-[20%] h-[980px] w-[980px] rounded-full bg-[#9c7c38]/18 blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="text-sm text-gray-600">Ustad → Student Overview</div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                {studentEmail || "Student"}
              </h1>
              <p className="mt-2 text-gray-700">
                Weekly goal: <span className="font-semibold">{weeklyGoalSummary}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/admin/student/${studentUid}`}
                className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900"
              >
                Log work
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
              >
                Back
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-gray-200 bg-white/70 p-6">
            <div className="text-sm font-semibold text-gray-900">Recent logs</div>

            {loadingLogs ? (
              <div className="mt-4 text-sm text-gray-600">Loading logs…</div>
            ) : logs.length ? (
              <div className="mt-4 grid gap-3">
                {logs.slice(0, 14).map((l, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                    <div className="text-xs text-gray-500">{l.dateKey}</div>
                    <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
                      <div><span className="font-semibold">Sabak:</span> {toText(l.sabak)}</div>
                      <div><span className="font-semibold">Sabak Dhor:</span> {toText(l.sabakDhor)}</div>
                      <div><span className="font-semibold">Dhor:</span> {toText(l.dhor)}</div>
                      <div><span className="font-semibold">Mistakes:</span> SD {toText(l.sabakDhorMistakes)} • D {toText(l.dhorMistakes)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-gray-600">No logs yet.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
