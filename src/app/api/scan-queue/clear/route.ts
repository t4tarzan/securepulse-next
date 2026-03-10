import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const user = await requireAuth();
    
    // Check if user is admin
    const userRole = await prisma.userRole.findFirst({
      where: { userId: user.id },
      include: { role: true },
    });

    if (userRole?.role.name !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }

    // Delete all scans (cascades to alerts)
    const result = await prisma.repositoryScan.deleteMany({});

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "SCANS_CLEARED",
        resourceType: "RepositoryScan",
        resourceId: "all",
        metadata: { count: result.count },
      },
    });

    return NextResponse.json({ 
      message: "All scans cleared",
      count: result.count,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to clear scans" }, { status: 500 });
  }
}
