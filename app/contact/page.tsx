"use client";

import Image from "next/image";

const WHATSAPP_NUMBER_INTL = "27606211418"; // +27 + 60 621 1418
const PHONE_DISPLAY = "060 621 1418";

const GOOGLE_MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=49+Mountainview+Drive,+Northcliff,+Randburg,+2115";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-transparent text-gray-900">
      {/* Fancy background (matches your other pages) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#efe8da] via-[#f7f4ee] to-white" />
        <div className="absolute -top-56 left-[-10%] h-[780px] w-[780px] rounded-full bg-[#9c7c38]/26 blur-3xl" />
        <div className="absolute top-[-20%] right-[-15%] h-[900px] w-[900px] rounded-full bg-black/18 blur-3xl" />
        <div className="absolute -bottom-72 left-[20%] h-[980px] w-[980px] rounded-full bg-[#9c7c38]/18 blur-3xl" />

        {/* subtle diamond pattern */}
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(45deg, rgba(0,0,0,0.18) 1px, transparent 1px), linear-gradient(-45deg, rgba(0,0,0,0.18) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            backgroundPosition: "0 0, 36px 36px",
          }}
        />

        {/* soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_15%,transparent_55%,rgba(0,0,0,0.12))]" />
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 sm:px-10 py-7 flex items-center justify-between">
        <a href="/" className="flex items-center gap-4">
          <div className="h-[80px] w-[85px] rounded-xl bg-white/100 backdrop-blur border border-gray-200 shadow-sm grid place-items-center">
                        <Image  src="/logo2.png"
                        alt="Hifdh Journal"
                        width={58}
                        height={58}
                        className="rounded" />
                      </div>

          <div className="hidden sm:block">
            <div className="text-sm uppercase tracking-widest text-[#9c7c38]">
              Contact
            </div>
            <div className="text-sm text-gray-600">Northcliff • Randburg</div>
          </div>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/login"
            className="inline-flex items-center justify-center h-11 px-5 rounded-full text-sm font-medium text-gray-800 hover:bg-white/60 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/signup"
            className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-900 shadow-sm"
          >
            Enrol Now
          </a>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pt-6 pb-20">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Left - Intro */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur px-4 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-[#9c7c38]" />
              <span className="text-gray-700">Speak to the Ustadh</span>
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight">
              Contact{" "}
              <span className="text-[#9c7c38]">Moulana Shaheed Bhabha</span>
            </h1>

            <p className="mt-6 text-lg text-gray-700 leading-relaxed max-w-xl">
              For enrolment, class details, or visiting the madrassah, contact the
              Ustadh directly. We’ll guide you with the class structure, schedule,
              and next steps.
            </p>

            {/* Quick actions */}
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER_INTL}?text=${encodeURIComponent(
                  "Assalamu Alaikum. I would like to enquire about enrolling in the Al Qadr Hifz Class."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-black text-white grid place-items-center shadow-sm">
                    {/* WhatsApp-ish chat icon */}
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                      <path
                        d="M21 12a8.5 8.5 0 01-12.9 7.3L3 20l.9-4.9A8.5 8.5 0 1121 12z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8.5 11.5c1.5 2.5 3.5 4 6 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className="text-[#9c7c38] text-sm font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                    Open →
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600">WhatsApp</div>
                  <div className="mt-1 text-lg font-semibold">{PHONE_DISPLAY}</div>
                  <div className="mt-2 text-sm text-gray-700">
                    Fastest way to enquire about enrolment.
                  </div>
                </div>
              </a>

              <a
                href={`tel:${PHONE_DISPLAY.replace(/\s/g, "")}`}
                className="group rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-black text-white grid place-items-center shadow-sm">
                    {/* phone icon */}
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                      <path
                        d="M6.5 3h3l1 5-2 1c1.2 2.4 3 4.2 5.4 5.4l1-2 5 1v3c0 1.1-.9 2-2 2C10.9 20.4 3.6 13.1 4 5c0-1.1.9-2 2-2z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-[#9c7c38] text-sm font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                    Call →
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="mt-1 text-lg font-semibold">{PHONE_DISPLAY}</div>
                  <div className="mt-2 text-sm text-gray-700">
                    Call for quick clarity on schedules and requirements.
                  </div>
                </div>
              </a>
            </div>

            {/* Note */}
            <div className="mt-8 rounded-3xl border border-gray-200 bg-gradient-to-br from-white/70 to-white/40 backdrop-blur p-6 shadow-sm">
              <div className="text-sm uppercase tracking-widest text-[#9c7c38]">
                Tip
              </div>
              <p className="mt-2 text-gray-700 leading-relaxed">
                When messaging, include the student’s name, age, and current level
                (beginner / intermediate / advanced) to help the Ustadh advise best.
              </p>
            </div>
          </div>

          {/* Right - Location card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-sm uppercase tracking-widest text-[#9c7c38]">
                      Location
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Visit the Madrassah
                    </h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">
                      Address:{" "}
                      <span className="font-semibold">
                        49 Mountainview Drive, Northcliff, Randburg, 2115
                      </span>
                    </p>
                  </div>

                  <div className="h-12 w-12 rounded-2xl bg-black text-white grid place-items-center shadow-sm">
                    {/* map pin */}
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                      <path
                        d="M12 21s7-4.4 7-11a7 7 0 10-14 0c0 6.6 7 11 7 11z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 10.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href={GOOGLE_MAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors shadow-sm"
                  >
                    Get Directions
                  </a>
                  <a
                    href="/signup"
                    className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-gray-300 bg-white/60 backdrop-blur text-sm font-semibold hover:bg-white transition-colors"
                  >
                    Enrol Online
                  </a>
                </div>
              </div>

              {/* Mini “map-like” decorative area */}
              <div className="relative h-40 sm:h-56 border-t border-gray-200">
                <div className="absolute inset-0 bg-gradient-to-br from-[#9c7c38]/10 via-transparent to-black/10" />
                <div
                  className="absolute inset-0 opacity-[0.35]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 30%, rgba(156,124,56,0.25), transparent 40%), radial-gradient(circle at 80% 20%, rgba(0,0,0,0.18), transparent 45%), radial-gradient(circle at 55% 80%, rgba(156,124,56,0.18), transparent 50%)",
                  }}
                />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-2xl border border-gray-200 bg-white/75 backdrop-blur px-5 py-4 shadow-md text-center">
                    <div className="text-sm font-semibold">Al Qadr Hifdh Class</div>
                    <div className="mt-1 text-xs text-gray-600">
                      Northcliff • Randburg
                    </div>
                    <a
                      href={GOOGLE_MAPS_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center h-10 px-4 rounded-full bg-[#9c7c38]/15 text-[#9c7c38] text-sm font-semibold hover:bg-[#9c7c38]/20 transition-colors"
                    >
                      Open in Maps →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Extra info card */}
            <div className="mt-6 rounded-3xl border border-gray-200 bg-white/60 backdrop-blur p-8 shadow-sm">
              <div className="text-sm uppercase tracking-widest text-[#9c7c38]">
                Enrolment
              </div>
              <h3 className="mt-2 text-2xl font-semibold">What to prepare</h3>
              <ul className="mt-4 space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#9c7c38]" />
                  Student full name & age
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#9c7c38]" />
                  Current reading / memorisation level
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#9c7c38]" />
                  Availability (days/times)
                </li>
              </ul>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER_INTL}?text=${encodeURIComponent(
                    "Assalamu Alaikum Moulana. I would like to enrol. Student name: ___, age: ___. Level: ___. Availability: ___."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors shadow-sm"
                >
                  Message on WhatsApp
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-gray-300 bg-white/60 backdrop-blur text-sm font-semibold hover:bg-white transition-colors"
                >
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Al Qadr Hifz Class. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="/" className="hover:text-black">
                Home
              </a>
              <span className="text-gray-300">|</span>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER_INTL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black"
              >
                WhatsApp
              </a>
              <span className="text-gray-300">|</span>
              <a
                href={GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black"
              >
                Maps
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
