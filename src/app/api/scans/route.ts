import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runScan } from "@/lib/scanners";

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

// POST /api/scans — trigger a real scan
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { repoId, imageId, scanType = "secret-scan" } = await req.json();

    if (!repoId && !imageId) {
      return NextResponse.json({ error: "repoId or imageId required" }, { status: 400 });
    }

    // Verify ownership and get repo details
    let repoFullName: string | null = null;
    if (repoId) {
      const repo = await prisma.gitHubRepository.findFirst({
        where: { id: repoId, userId: user.id },
      });
      if (!repo) return NextResponse.json({ error: "Repo not found" }, { status: 404 });
      repoFullName = repo.fullName;
    }
    if (imageId) {
      const image = await prisma.dockerImage.findFirst({
        where: { id: imageId, userId: user.id },
      });
      if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Create scan record as "running"
    const scan = await prisma.repositoryScan.create({
      data: {
        githubRepoId: repoId || null,
        dockerImageId: imageId || null,
        scanType,
        status: "running",
      },
    });

    // Get user's GitHub token
    const oauthToken = await prisma.oAuthToken.findFirst({
      where: { userId: user.id, provider: "github" },
      orderBy: { updatedAt: "desc" },
    });

    if (!oauthToken && repoFullName) {
      await prisma.repositoryScan.update({
        where: { id: scan.id },
        data: { status: "failed", errorMessage: "No GitHub token found. Connect GitHub first.", completedAt: new Date() },
      });
      return NextResponse.json({ error: "No GitHub token. Connect GitHub first." }, { status: 400 });
    }

    // Run the actual scan
    try {
      const result = await runScan(scanType, repoFullName!, oauthToken!.accessToken);

      // Create alerts from findings
      if (result.findings.length > 0) {
        await prisma.alert.createMany({
          data: result.findings.map((f) => ({
            scanId: scan.id,
            severity: f.severity,
            title: f.rule,
            description: f.description,
            filePath: f.filePath,
            lineNumber: f.lineNumber,
            commit: f.match,
            status: "open",
          })),
        });
      }

      // Update scan as completed
      await prisma.repositoryScan.update({
        where: { id: scan.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          summary: result.summary as any,
        },
      });

      // Update lastScanned on repo
      if (repoId) {
        await prisma.gitHubRepository.update({
          where: { id: repoId },
          data: { lastScanned: new Date() },
        });
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "SCAN_COMPLETED",
          resourceType: "RepositoryScan",
          resourceId: scan.id,
          metadata: { scanType, repoFullName, findings: result.summary },
        },
      });

      return NextResponse.json({
        id: scan.id,
        status: "completed",
        summary: result.summary,
        alertsCreated: result.findings.length,
      }, { status: 201 });

    } catch (scanError: any) {
      // Scan execution failed
      await prisma.repositoryScan.update({
        where: { id: scan.id },
        data: {
          status: "failed",
          errorMessage: scanError.message || "Scan failed",
          completedAt: new Date(),
        },
      });
      return NextResponse.json({
        id: scan.id,
        status: "failed",
        error: scanError.message || "Scan execution failed",
      }, { status: 500 });
    }

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Scan API error:", error);
    return NextResponse.json({ error: "Failed to create scan" }, { status: 500 });
  }
}
