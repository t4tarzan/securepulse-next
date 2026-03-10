import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE() {
  try {
    const user = await requireAuth();

    // Delete all GitHub repositories for this user (cascades to scans and alerts)
    const result = await prisma.gitHubRepository.deleteMany({
      where: { userId: user.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "GITHUB_REPOS_CLEARED",
        resourceType: "GitHubRepository",
        resourceId: "all",
        metadata: { count: result.count },
      },
    });

    return NextResponse.json({
      message: "All GitHub repositories cleared",
      count: result.count,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to clear repositories" }, { status: 500 });
  }
}
