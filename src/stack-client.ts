"use client";

import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    home: "/",
    signIn: "/signin",
    signUp: "/signin",
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
  },
});
