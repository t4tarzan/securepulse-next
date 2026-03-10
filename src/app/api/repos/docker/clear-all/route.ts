import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE() {
  try {
    const user = await requireAuth();

    // Delete all Docker images for this user (cascades to scans and alerts)
    const result = await prisma.dockerImage.deleteMany({
      where: { userId: user.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DOCKER_IMAGES_CLEARED",
        resourceType: "DockerImage",
        resourceId: "all",
        metadata: { count: result.count },
      },
    });

    return NextResponse.json({
      message: "All Docker images cleared",
      count: result.count,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to clear Docker images" }, { status: 500 });
  }
}
