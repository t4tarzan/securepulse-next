import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Container, Scan, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [repoCount, imageCount, scanCount, alertCounts] = await Promise.all([
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

  const criticalCount = alertCounts.find((a) => a.severity === "critical")?._count ?? 0;
  const highCount = alertCounts.find((a) => a.severity === "high")?._count ?? 0;
  const mediumCount = alertCounts.find((a) => a.severity === "medium")?._count ?? 0;
  const lowCount = alertCounts.find((a) => a.severity === "low")?._count ?? 0;
  const totalAlerts = criticalCount + highCount + mediumCount + lowCount;

  const recentScans = await prisma.repositoryScan.findMany({
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
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {user.name ?? user.email}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repositories</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repoCount}</div>
            <p className="text-xs text-muted-foreground">GitHub repos connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Docker Images</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{imageCount}</div>
            <p className="text-xs text-muted-foreground">Images monitored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Scan className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scanCount}</div>
            <p className="text-xs text-muted-foreground">Scans performed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Severity Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alert Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Critical</span>
                </div>
                <Badge variant="destructive">{criticalCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">High</span>
                </div>
                <Badge className="bg-orange-500">{highCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Medium</span>
                </div>
                <Badge className="bg-yellow-500">{mediumCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Low</span>
                </div>
                <Badge className="bg-blue-500">{lowCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentScans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scans yet. Connect a repository to get started.</p>
              ) : (
                recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {scan.githubRepo?.fullName ?? scan.dockerImage?.imageName ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {scan.scanType} · {scan.startedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={scan.status === "completed" ? "default" : scan.status === "failed" ? "destructive" : "secondary"}>
                        {scan.status}
                      </Badge>
                      {scan._count.alerts > 0 && (
                        <Badge variant="outline">{scan._count.alerts} alerts</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
