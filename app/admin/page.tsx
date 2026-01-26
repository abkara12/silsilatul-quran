"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type Student = { uid: string; email: string };

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string>("");

  const selected = useMemo(
    () => students.find((s) => s.uid === selectedUid) ?? null,
    [students, selectedUid]
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const me = await getDoc(doc(db, "users", u.uid));
        const role = me.exists() ? (me.data() as any).role : null;
        setIsAdmin(role === "admin");
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    async function loadStudents() {
      if (!isAdmin) return;
      setLoadingStudents(true);

      try {
        // ✅ Only students
        const q = query(
          collection(db, "users"),
          where("role", "==", "student"),
          orderBy("email")
        );

        const snap = await getDocs(q);
        const list: Student[] = snap.docs
          .map((d) => ({ uid: d.id, email: ((d.data() as any).email ?? "").toLowerCase() }))
          .filter((s) => s.email);

        setStudents(list);
        // auto select first student
        if (list.length && !selectedUid) setSelectedUid(list[0].uid);
      } catch (e) {
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    }

    if (!checking && isAdmin) loadStudents();
  }, [checking, isAdmin, selectedUid]);

  // ✅ Smooth loading: don’t render “not admin” until auth check completes
  if (checking) {
    return (
      <main className="min-h-screen text-gray-900">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-sm">
            <div className="h-4 w-28 rounded-full bg-black/10 animate-pulse" />
            <div className="mt-4 h-8 w-64 rounded-2xl bg-black/10 animate-pulse" />
            <div className="mt-3 h-4 w-full rounded-full bg-black/10 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen text-gray-900">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8 shadow-sm">
            <div className="text-sm text-gray-600">Admin</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Please sign in</h1>
            <p className="mt-2 text-gray-700">Log in to access the Ustad dashboard.</p>

            <div className="mt-6 flex gap-3">
              <Link
                className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900"
                href="/login"
              >
                Go to login
              </Link>
              <Link
                className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
                href="/"
              >
                Home
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
            <div className="text-sm text-gray-600">Admin</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Not allowed</h1>
            <p className="mt-2 text-gray-700">
              This account is not an admin.
            </p>

            <div className="mt-6 flex gap-3">
              <Link
                className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
                href="/"
              >
                Home
              </Link>
              <Link
                className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
                href="/my-progress"
              >
                My Progress
              </Link>
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
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-[#9c7c38]" />
                <span className="text-gray-700">Ustad Dashboard</span>
              </div>
              <h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">
                Enter student work
              </h1>
              <p className="mt-2 text-gray-700">
                Select a student and log today’s work.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-gray-200 bg-white/70 hover:bg-white transition-colors text-sm font-semibold"
            >
              Home
            </Link>
          </div>

          <div className="mt-8 grid gap-4">
            <div className="rounded-3xl border border-gray-200 bg-white/70 p-5">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Student
              </div>

              <select
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
                className="w-full h-12 rounded-2xl border border-gray-200 bg-white/80 px-4 outline-none focus:ring-2 focus:ring-[#9c7c38]/30"
              >
                {loadingStudents ? (
                  <option>Loading students…</option>
                ) : students.length ? (
                  students.map((s) => (
                    <option key={s.uid} value={s.uid}>
                      {s.email}
                    </option>
                  ))
                ) : (
                  <option>No students found</option>
                )}
              </select>

              {selected && (
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/admin/student/${selected.uid}`}
                    className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900"
                  >
                    Log work →
                  </Link>

                  <Link
                    href={`/admin/student/${selected.uid}/overview`}
                    className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-gray-200 bg-white/70 hover:bg-white text-sm font-semibold"
                  >
                    View overview →
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            Tip: Students must sign up at least once so they appear here.
          </div>
        </div>
      </div>
    </main>
  );
}
