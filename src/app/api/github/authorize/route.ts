import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  try {
    const user = await requireAuth();

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });
    }

    const state = crypto.randomBytes(16).toString("hex");

    // Store state in a cookie for verification on callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securepulse-next.vercel.app";
    const redirectUri = `${appUrl}/api/github/callback`;

    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "repo read:user");
    url.searchParams.set("state", state);

    const response = NextResponse.redirect(url.toString());
    response.cookies.set("github_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.redirect(new URL("/signin", process.env.NEXT_PUBLIC_APP_URL || "https://securepulse-next.vercel.app"));
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
