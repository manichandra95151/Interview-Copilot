import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest, event: any) {
  const isAuthEnabled = process.env.isAuth === 'true' || process.env.IS_AUTH === 'true';
  if (!isAuthEnabled) {
    return NextResponse.next();
  }
  return withAuth({
    pages: { signIn: "/" }, // redirect to HOME not /login
  })(req, event);
}

export const config = {
  // protect app pages but NOT report/shared (public) or home
  matcher: ["/dashboard/:path*", "/setup/:path*", "/interview/:path*", "/report/:path*"],
};