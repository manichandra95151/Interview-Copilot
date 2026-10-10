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
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F8F7FF]">
      {/* Left — form */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm scale-in">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center text-white font-black text-sm shadow-md shadow-purple-200/60">
              C
            </div>
            <span className="font-bold text-gray-900 tracking-tight">CopilotHire</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">{title}</h1>
          <p className="text-sm text-gray-500 mb-7">{subtitle}</p>
          {children}
          <div className="text-sm text-gray-500 mt-6 text-center">{footer}</div>
        </div>
      </div>

      {/* Right — brand panel */}
      <div className="hidden lg:flex relative overflow-hidden brand-gradient items-center justify-center p-12">
        <div className="absolute inset-0 grid-texture opacity-30" />
        <div className="absolute top-16 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl float" />
        <div className="relative z-10 max-w-md text-white">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-full mb-6 tracking-widest uppercase">
            AI Interview Intelligence
          </div>
          <h2 className="text-3xl font-extrabold leading-tight mb-4">
            Run sharper interviews with an AI copilot in the room.
          </h2>
          <p className="text-purple-100 text-sm leading-relaxed">
            Match resumes to roles, generate tailored questions, transcribe live, and get a
            calibrated report — all in one workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
