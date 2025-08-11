import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from "@/lib/env";

const isCorrectCredentials = (credentials: { username?: string; password?: string }) =>
  credentials?.username === env.UI_LOGIN && credentials?.password === env.UI_PASS;

const options: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        username: { label: "Username", type: "text", placeholder: "agent007" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials: { username?: string; password?: string } | undefined) => {
        if (credentials && isCorrectCredentials(credentials)) {
          const user = { id: "1", name: "Admin" };
          // Any object returned will be saved in `user` property of the JWT
          return Promise.resolve(user);
        }
        // If you return null or false then the credentials will be rejected
        return Promise.resolve(null);
        // You can also Reject this callback with an Error or with a URL:
        // return Promise.reject(new Error('error message')) // Redirect to error page
        // return Promise.reject('/path/to/redirect')        // Redirect to a URL
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
};
const handler = NextAuth(options);
//export default (req, res) => NextAuth(req, res, options);

export { handler as POST, handler as GET };
