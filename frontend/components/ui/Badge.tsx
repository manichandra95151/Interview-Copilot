import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "green" | "amber" | "red" | "blue";

const TONES: Record<Tone, string> = {
  neutral: "bg-[#F5F3EE] text-[#6A665E]",
  brand: "bg-[#EEF0FF] text-[#4F46E5]",
  green: "bg-[#E9F7EF] text-green-700",
  amber: "bg-[#FBF2DF] text-[#92610F]",
  red: "bg-[#FCECEC] text-red-700",
  blue: "bg-blue-50 text-blue-600",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}
