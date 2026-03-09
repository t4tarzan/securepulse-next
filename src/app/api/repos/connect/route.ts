import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { token, label = "default" } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Validate the token
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid GitHub token" }, { status: 400 });
    }

    const ghUser = await res.json();

    await prisma.oAuthToken.upsert({
      where: {
        userId_provider_label: { userId: user.id, provider: "github", label },
      },
      update: { accessToken: token, updatedAt: new Date() },
      create: { userId: user.id, provider: "github", label, accessToken: token },
    });

    return NextResponse.json({ message: "Connected", github_user: ghUser.login });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to connect" }, { status: 500 });
  }
}
