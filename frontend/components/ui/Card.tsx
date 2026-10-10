import { cn } from "@/lib/cn";

export function Card({
  className,
  hover,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-[#EDE9FF] p-5",
        hover && "card-lift",
        className
      )}
      {...props}
    />
  );
}
