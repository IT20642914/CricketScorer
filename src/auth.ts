import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dns from "dns";

// Fix DNS resolution for MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }: any) {
      // After sign-in, redirect to home page
      if (url.startsWith("/api/auth/signin")) {
        return baseUrl;
      }
      // If callback URL is provided, use it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default to home page
      return baseUrl;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  // Required for NextAuth v5
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

console.log("[NextAuth] Initialized:", {
  hasHandlers: !!handlers,
  hasAuth: !!auth,
  hasSignIn: !!signIn,
  hasSignOut: !!signOut,
});
