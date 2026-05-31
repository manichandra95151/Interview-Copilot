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
export { handler as GET, handler as POST };