import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshScansButton } from "@/components/refresh-scans-button";

// Force dynamic rendering to show latest scans
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const statusColors: Record<string, string> = {
  completed: "default",
  failed: "destructive",
  pending: "secondary",
  running: "outline",
};

const scanTypeLabels: Record<string, string> = {
  "secret-scan": "Secret Scan",
  "sast": "SAST",
  "dependency": "Dependency Audit",
  "full": "Full Scan",
  // Legacy labels for backward compatibility
  "scan-github": "Secret Scan (TruffleHog)",
  "scan-docker": "Secret Scan (Gitleaks)",
  "scan-docker-vuln": "CVE Scan (Trivy)",
  "scan-sast": "SAST (Semgrep)",
  "scan-malware": "Malware (VirusTotal)",
  "scan-deps": "Dependencies (npm audit)",
};

export default async function ScansPage() {
  const user = await getCurrentUser();
  if (!user) return null;

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
    take: 50,
  });

  // Debug: log scan count
  console.log(`[Scans Page] Found ${scans.length} scans for user ${user.id}`);
  if (scans.length > 0) {
    console.log(`[Scans Page] First scan:`, {
      id: scans[0].id,
      type: scans[0].scanType,
      status: scans[0].status,
      repoId: scans[0].githubRepoId,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scans</h2>
          <p className="text-muted-foreground">
            View scan history and results
          </p>
        </div>
        <RefreshScansButton />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target</TableHead>
                <TableHead>Scan Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <p className="font-medium">No scans found</p>
                      <p className="text-sm mt-1">Trigger a scan from the Repositories page to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-medium">
                      {scan.githubRepo?.fullName ?? scan.dockerImage?.imageName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {scanTypeLabels[scan.scanType] ?? scan.scanType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[scan.status] as any ?? "secondary"}>
                        {scan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {scan._count.alerts > 0 ? (
                        <Badge variant="destructive">{scan._count.alerts}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {scan.startedAt.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {scan.completedAt?.toLocaleString() ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
