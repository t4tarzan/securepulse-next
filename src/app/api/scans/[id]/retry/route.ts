import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runScan } from "@/lib/scanners";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Get the failed scan
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

    // Update scan to running
    await prisma.repositoryScan.update({
      where: { id },
      data: {
        status: "running",
        errorMessage: null,
        completedAt: null,
      },
    });

    // Get user's GitHub token
    const oauthToken = await prisma.oAuthToken.findFirst({
      where: { userId: user.id, provider: "github" },
      orderBy: { updatedAt: "desc" },
    });

    if (!oauthToken && scan.githubRepo) {
      await prisma.repositoryScan.update({
        where: { id },
        data: { 
          status: "failed", 
          errorMessage: "No GitHub token found",
          completedAt: new Date(),
        },
      });
      return NextResponse.json({ error: "No GitHub token" }, { status: 400 });
    }

    // Run the scan
    try {
      const repoFullName = scan.githubRepo?.fullName || "";
      const result = await runScan(scan.scanType, repoFullName, oauthToken!.accessToken);

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
        where: { id },
        data: {
          status: "completed",
          completedAt: new Date(),
          summary: result.summary as any,
        },
      });

      return NextResponse.json({
        id: scan.id,
        status: "completed",
        alertsCreated: result.findings.length,
      });
    } catch (scanError: any) {
      await prisma.repositoryScan.update({
        where: { id },
        data: {
          status: "failed",
          errorMessage: scanError.message || "Scan failed",
          completedAt: new Date(),
        },
      });
      return NextResponse.json({
        id: scan.id,
        status: "failed",
        error: scanError.message,
      }, { status: 500 });
    }
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to retry scan" }, { status: 500 });
  }
}
