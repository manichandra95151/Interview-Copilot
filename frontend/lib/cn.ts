/** Tiny className joiner — filters falsy values and joins with spaces. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
