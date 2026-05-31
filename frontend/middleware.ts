import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/" }, // redirect to HOME not /login
});

export const config = {
  // protect app pages but NOT report/shared (public) or home
  matcher: ["/dashboard/:path*", "/setup/:path*", "/interview/:path*", "/report/:path*"],
};