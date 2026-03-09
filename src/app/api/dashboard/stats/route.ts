import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuth();

    const [repoCount, imageCount, scanCount, alertsByStatus, alertsBySeverity] =
      await Promise.all([
        prisma.gitHubRepository.count({ where: { userId: user.id } }),
        prisma.dockerImage.count({ where: { userId: user.id } }),
        prisma.repositoryScan.count({
          where: {
            OR: [
              { githubRepo: { userId: user.id } },
              { dockerImage: { userId: user.id } },
            ],
          },
        }),
        prisma.alert.groupBy({
          by: ["status"],
          where: {
            scan: {
              OR: [
                { githubRepo: { userId: user.id } },
                { dockerImage: { userId: user.id } },
              ],
            },
          },
          _count: true,
        }),
        prisma.alert.groupBy({
          by: ["severity"],
          where: {
            status: "open",
            scan: {
              OR: [
                { githubRepo: { userId: user.id } },
                { dockerImage: { userId: user.id } },
              ],
            },
          },
          _count: true,
        }),
      ]);

    return NextResponse.json({
      repos: repoCount,
      images: imageCount,
      scans: scanCount,
      alertsByStatus: Object.fromEntries(alertsByStatus.map((a) => [a.status, a._count])),
      alertsBySeverity: Object.fromEntries(alertsBySeverity.map((a) => [a.severity, a._count])),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
