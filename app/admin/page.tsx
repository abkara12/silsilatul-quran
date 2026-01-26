"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDoc, getDocs, doc, query, where } from "firebase/firestore";
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

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [result, setResult] = useState<{ uid: string; email: string } | null>(null);

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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setResult(null);

    const target = email.trim().toLowerCase();
    if (!target) return;

    setSearching(true);
    try {
      const q = query(collection(db, "users"), where("email", "==", target));
      const snap = await getDocs(q);

      if (snap.empty) {
        setErr("No student found with that email. (They may have signed up before email saving was added.)");
        return;
      }

      const doc1 = snap.docs[0];
      const data = doc1.data() as any;

      setResult({ uid: doc1.id, email: data.email || target });
    } catch (e: any) {
      setErr(e?.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen p-10">
        <div className="rounded-2xl border p-6">Loading…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen p-10">
        <div className="rounded-2xl border p-6">
          <div className="text-xl font-semibold">Admin</div>
          <p className="mt-2 text-gray-600">Please sign in.</p>
          <div className="mt-4">
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
          <p className="mt-2 text-gray-600">
            Your account is not an admin. Set <code>role: "admin"</code> in Firestore for your user doc.
          </p>
          <div className="mt-4 flex gap-3">
            <Link className="underline" href="/">Home</Link>
            <Link className="underline" href="/my-progress">My Progress</Link>
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
              <div className="text-sm text-gray-600">Admin Dashboard</div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Enter student progress</h1>
              <p className="mt-2 text-gray-700">
                Search a student by email, then submit their work for <span className="font-semibold">{today}</span>.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 px-4 rounded-full border border-gray-200 bg-white/70 hover:bg-white transition-colors text-sm"
            >
              Home
            </Link>
          </div>

          <form onSubmit={handleSearch} className="mt-6 grid gap-3">
            <label className="text-sm font-medium text-gray-800">Student Email</label>
            <div className="flex gap-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="student@email.com"
                className="flex-1 h-12 rounded-2xl border border-gray-200 bg-white/80 px-4 outline-none focus:ring-2 focus:ring-[#9c7c38]/40"
              />
              <button
                disabled={searching}
                className="h-12 px-5 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 disabled:opacity-60"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>

            {err && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}

            {result && (
              <div className="mt-3 rounded-2xl border border-gray-200 bg-white/70 px-5 py-4">
                <div className="text-sm text-gray-600">Found student</div>
                <div className="mt-1 font-semibold">{result.email}</div>

                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/admin/student/${result.uid}`}
                    className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900"
                  >
                    Open student dashboard →
                  </Link>

                  <Link
                    href={`/overview`}
                    className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
                  >
                    My Overview
                  </Link>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
