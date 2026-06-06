import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile) {
        token.sub = (profile as any).sub ?? token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session as any)._token = sign(
          { sub: token.sub, email: token.email },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
      }
      return session;
    },
  },
  pages: { signIn: "/" }, // redirect to HOME
};

const handler = NextAuth(authOptions);

const customGetHandler = async (req: any, res: any) => {
  const isAuthEnabled = process.env.isAuth === 'true' || process.env.IS_AUTH === 'true';
  if (!isAuthEnabled) {
    const url = new URL(req.url);
    if (url.pathname.endsWith('/api/auth/session')) {
      const mockToken = sign(
        { sub: 'mock-user-id', email: 'mock-user@example.com' },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return new Response(
        JSON.stringify({
          user: {
            name: "Mock User",
            email: "mock-user@example.com",
            image: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
          },
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          _token: mockToken
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
  return handler(req, res);
};

export { customGetHandler as GET, handler as POST };