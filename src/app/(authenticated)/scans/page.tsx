import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshScansButton } from "@/components/refresh-scans-button";
import { ScanQueueControls } from "@/components/scan-queue-controls";
import { ScanStatsCards } from "@/components/scan-stats-cards";
import { RetryScanButton } from "@/components/retry-scan-button";
import { DeleteScanButton } from "@/components/delete-scan-button";

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
  "sast": "SAST Analysis",
  "dependency": "Dependency Audit",
  "full": "Full Scan",
  "trufflehog": "TruffleHog (Secrets)",
  "gitleaks": "Gitleaks (Secrets)",
  "trivy": "Trivy (CVE)",
  "semgrep": "Semgrep (SAST)",
  "virustotal": "VirusTotal (Malware)",
  "npm-audit": "npm audit (Dependencies)",
};

function formatDuration(startedAt: Date, completedAt: Date | null): string {
  if (!completedAt) return "—";
  const duration = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);
  if (duration < 60) return `${duration}s`;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
}

export default async function ScansPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Get user role for admin controls
  const userRole = await prisma.userRole.findFirst({
    where: { userId: user.id },
    include: { role: true },
  });
  const isAdmin = userRole?.role.name === "admin" || userRole?.role.name === "security-admin";

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
    take: 200,
  });

  // Calculate stats
  const allScans = scans.length;
  const runningScans = scans.filter(s => s.status === "running");
  const completedScans = scans.filter(s => s.status === "completed");
  const failedScans = scans.filter(s => s.status === "failed");
  const pendingScans = scans.filter(s => s.status === "pending");

  const passRate = allScans > 0 ? (completedScans.length / allScans) * 100 : 0;
  const avgDuration = completedScans.length > 0
    ? Math.floor(
        completedScans.reduce((sum, scan) => {
          if (scan.completedAt) {
            return sum + (scan.completedAt.getTime() - scan.startedAt.getTime()) / 1000;
          }
          return sum;
        }, 0) / completedScans.length
      )
    : 0;

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
        <div className="flex items-center gap-2">
          <RefreshScansButton />
        </div>
      </div>

      {/* Queue Controls - Admin Only */}
      {isAdmin && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                {runningScans.length} Running
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                {pendingScans.length} Waiting
              </Badge>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {completedScans.length} Completed
              </Badge>
              <Badge variant="destructive">
                {failedScans.length} Failed
              </Badge>
            </div>
          </div>
          <ScanQueueControls />
        </div>
      )}

      {/* Stats Cards */}
      <ScanStatsCards
        passRate={passRate}
        avgDuration={avgDuration}
        activeScans={runningScans.length}
        totalScans={allScans}
      />

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All <Badge variant="secondary" className="ml-1.5 text-xs">{allScans}</Badge>
          </TabsTrigger>
          <TabsTrigger value="running">
            Running <Badge variant="outline" className="ml-1.5 text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">{runningScans.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed <Badge variant="outline" className="ml-1.5 text-xs bg-green-500/10 text-green-500 border-green-500/20">{completedScans.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed <Badge variant="destructive" className="ml-1.5 text-xs">{failedScans.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
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
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
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
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {scan.startedAt.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDuration(scan.startedAt, scan.completedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {scan.status === "failed" && <RetryScanButton scanId={scan.id} />}
                            <DeleteScanButton scanId={scan.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="running" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Scan Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runningScans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No running scans
                      </TableCell>
                    </TableRow>
                  ) : (
                    runningScans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell className="font-medium">
                          {scan.githubRepo?.fullName ?? scan.dockerImage?.imageName ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {scanTypeLabels[scan.scanType] ?? scan.scanType}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            {scan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {scan.startedAt.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDuration(scan.startedAt, new Date())}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Scan Type</TableHead>
                    <TableHead>Alerts</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedScans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No completed scans
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedScans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell className="font-medium">
                          {scan.githubRepo?.fullName ?? scan.dockerImage?.imageName ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {scanTypeLabels[scan.scanType] ?? scan.scanType}
                        </TableCell>
                        <TableCell>
                          {scan._count.alerts > 0 ? (
                            <Badge variant="destructive">{scan._count.alerts}</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Clean</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {scan.startedAt.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDuration(scan.startedAt, scan.completedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DeleteScanButton scanId={scan.id} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Scan Type</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedScans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No failed scans
                      </TableCell>
                    </TableRow>
                  ) : (
                    failedScans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell className="font-medium">
                          {scan.githubRepo?.fullName ?? scan.dockerImage?.imageName ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {scanTypeLabels[scan.scanType] ?? scan.scanType}
                        </TableCell>
                        <TableCell className="text-sm text-red-500 max-w-xs truncate">
                          {scan.errorMessage ?? "Unknown error"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {scan.startedAt.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <RetryScanButton scanId={scan.id} />
                            <DeleteScanButton scanId={scan.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
