import "server-only";
import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    home: "/",
    handler: "/handler",
    signIn: "/signin",
    signUp: "/signin",
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
  },
});
