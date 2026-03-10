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

    if (userRole?.role.name !== "admin" && userRole?.role.name !== "security-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update all pending scans to failed
    const result = await prisma.repositoryScan.updateMany({
      where: { status: "pending" },
      data: { 
        status: "failed", 
        errorMessage: "Stopped by admin",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      message: "Stopped all pending scans",
      count: result.count,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to stop pending scans" }, { status: 500 });
  }
}
