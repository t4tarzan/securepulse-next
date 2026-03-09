import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/scans — list scans for the current user
export async function GET() {
  try {
    const user = await requireAuth();

    const scans = await prisma.repositoryScan.findMany({
      where: {
        OR: [
          { githubRepo: { userId: user.id } },
          { dockerImage: { userId: user.id } },
        ],
      },
      include: {
        githubRepo: { select: { fullName: true } },
        dockerImage: { select: { imageName: true } },
        _count: { select: { alerts: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(scans);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
  }
}

// POST /api/scans — trigger a scan
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { repoId, imageId, scanType = "scan-github" } = await req.json();

    if (!repoId && !imageId) {
      return NextResponse.json({ error: "repoId or imageId required" }, { status: 400 });
    }

    // Verify ownership
    if (repoId) {
      const repo = await prisma.gitHubRepository.findFirst({
        where: { id: repoId, userId: user.id },
      });
      if (!repo) return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    }
    if (imageId) {
      const image = await prisma.dockerImage.findFirst({
        where: { id: imageId, userId: user.id },
      });
      if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const scan = await prisma.repositoryScan.create({
      data: {
        githubRepoId: repoId || null,
        dockerImageId: imageId || null,
        scanType,
        status: "pending",
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "SCAN_TRIGGERED",
        resourceType: "RepositoryScan",
        resourceId: scan.id,
        metadata: { scanType, repoId, imageId },
      },
    });

    return NextResponse.json(scan, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create scan" }, { status: 500 });
  }
}
