import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { notes = "" } = await req.json();

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

    await prisma.alert.update({
      where: { id },
      data: { status: "resolved" },
    });

    await prisma.alertResolution.upsert({
      where: { alertId: id },
      update: { resolvedBy: user.id, resolutionNotes: notes },
      create: { alertId: id, resolvedBy: user.id, resolutionNotes: notes },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ALERT_RESOLVED",
        resourceType: "Alert",
        resourceId: id,
      },
    });

    return NextResponse.json({ message: "Resolved" });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
