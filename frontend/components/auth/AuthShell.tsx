import Link from "next/link";

/** Shared split-panel layout for login & signup. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#FBFAF7]">
      {/* Left — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm scale-in">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-[11px] brand-gradient flex items-center justify-center text-white font-black text-sm shadow-sm">
              C
            </div>
            <span className="font-semibold text-[#1A1A1A] tracking-tight">CopilotHire</span>
          </Link>
          <h1 className="text-[28px] font-semibold text-[#1A1A1A] tracking-tight mb-2">{title}</h1>
          <p className="text-sm text-[#6A665E] mb-8">{subtitle}</p>
          {children}
          <div className="text-sm text-[#6A665E] mt-7 text-center">{footer}</div>
        </div>
      </div>

      {/* Right — editorial brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-[#1A1A1A] items-center justify-center p-14">
        <div className="absolute inset-0 grid-texture opacity-[0.06]" />
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-[#4F46E5]/25 rounded-full blur-[90px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#E8A33D]/15 rounded-full blur-[90px] float" />
        <div className="relative z-10 max-w-md text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/80 text-[11px] font-semibold px-3 py-1.5 rounded-full mb-7 tracking-[0.12em] uppercase">
            Interview intelligence
          </div>
          <h2 className="text-[34px] leading-[1.15] mb-5 font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            A calmer way to run a <span className="italic text-[#E8A33D]">great</span> interview.
          </h2>
          <p className="text-white/55 text-[15px] leading-relaxed">
            Match resumes to roles, generate tailored questions, transcribe live, and leave with a
            calibrated report — all in one quiet workspace.
          </p>
          <div className="mt-10 flex items-center gap-6 text-white/40 text-xs">
            <div>
              <p className="text-white text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>10×</p>
              <p className="mt-1">faster shortlisting</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-white text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Real-time</p>
              <p className="mt-1">scoring & follow-ups</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
