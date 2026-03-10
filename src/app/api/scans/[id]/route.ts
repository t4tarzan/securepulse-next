import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Get the scan
    const scan = await prisma.repositoryScan.findUnique({
      where: { id },
      include: {
        githubRepo: true,
        dockerImage: true,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Verify ownership
    if (scan.githubRepo && scan.githubRepo.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (scan.dockerImage && scan.dockerImage.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the scan (cascades to alerts)
    await prisma.repositoryScan.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "SCAN_DELETED",
        resourceType: "RepositoryScan",
        resourceId: id,
      },
    });

    return NextResponse.json({ message: "Scan deleted" });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete scan" }, { status: 500 });
  }
}
