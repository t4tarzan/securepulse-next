import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/alerts — list alerts for current user
export async function GET() {
  try {
    const user = await requireAuth();

    const alerts = await prisma.alert.findMany({
      where: {
        scan: {
          OR: [
            { githubRepo: { userId: user.id } },
            { dockerImage: { userId: user.id } },
          ],
        },
      },
      include: {
        scan: {
          include: {
            githubRepo: { select: { fullName: true } },
            dockerImage: { select: { imageName: true } },
          },
        },
      },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      take: 200,
    });

    return NextResponse.json(alerts);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
