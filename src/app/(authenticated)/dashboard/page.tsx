import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Container, Scan, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { ClickableStatCard } from "@/components/clickable-stat-card";
import { SecurityScoreWidget } from "@/components/security-score-widget";
import { ScanTrendChart } from "@/components/scan-trend-chart";
import { formatDateShort } from "@/lib/format-date";

export default async function DashboardPage() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

  const [repoCount, imageCount, scanCount, alertCounts, completedScans, allAlerts] = await Promise.all([
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
    prisma.repositoryScan.count({
      where: {
        status: "completed",
        OR: [
          { githubRepo: { userId: user.id } },
          { dockerImage: { userId: user.id } },
        ],
      },
    }),
    prisma.alert.groupBy({
      by: ["severity"],
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
  ]);

  const criticalCount = alertCounts.find((a) => a.severity === "critical")?._count ?? 0;
  const highCount = alertCounts.find((a) => a.severity === "high")?._count ?? 0;
  const mediumCount = alertCounts.find((a) => a.severity === "medium")?._count ?? 0;
  const lowCount = alertCounts.find((a) => a.severity === "low")?._count ?? 0;
  const totalAlerts = criticalCount + highCount + mediumCount + lowCount;

  // Calculate security score
  const scanPassRate = scanCount > 0 ? completedScans / scanCount : 1;
  const totalAllAlerts = allAlerts.reduce((sum, a) => sum + a._count, 0);
  const allCritical = allAlerts.find((a) => a.severity === "critical")?._count ?? 0;
  const allHigh = allAlerts.find((a) => a.severity === "high")?._count ?? 0;
  const allMedium = allAlerts.find((a) => a.severity === "medium")?._count ?? 0;
  const allLow = allAlerts.find((a) => a.severity === "low")?._count ?? 0;
  const severityPenalty = totalAllAlerts > 0 
    ? (allCritical * 0.4 + allHigh * 0.2 + allMedium * 0.1 + allLow * 0.05) / totalAllAlerts
    : 0;
  const securityScore = Math.round((scanPassRate * 50) + ((1 - severityPenalty) * 50));

  // Get 30-day scan trends
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const scansByDay = await prisma.repositoryScan.groupBy({
    by: ["status"],
    where: {
      startedAt: { gte: thirtyDaysAgo },
      OR: [
        { githubRepo: { userId: user.id } },
        { dockerImage: { userId: user.id } },
      ],
    },
    _count: true,
  });

  // Generate 30-day trend data
  const trendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      completed: 0,
      failed: 0,
    };
  });

  // This is a simplified version - in production, you'd query by date
  const completedTotal = scansByDay.find(s => s.status === "completed")?._count ?? 0;
  const failedTotal = scansByDay.find(s => s.status === "failed")?._count ?? 0;
  if (trendData.length > 0) {
    trendData[trendData.length - 1].completed = completedTotal;
    trendData[trendData.length - 1].failed = failedTotal;
  }

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

      {/* Stats Cards - Now Clickable */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ClickableStatCard
          title="Repositories"
          value={repoCount}
          subtitle="GitHub repos connected"
          icon={GitBranch}
          href="/repositories"
        />
        <ClickableStatCard
          title="Docker Images"
          value={imageCount}
          subtitle="Images monitored"
          icon={Container}
          href="/repositories"
        />
        <ClickableStatCard
          title="Total Scans"
          value={scanCount}
          subtitle="Scans performed"
          icon={Scan}
          href="/scans"
        />
        <ClickableStatCard
          title="Open Alerts"
          value={totalAlerts}
          subtitle="Require attention"
          icon={AlertTriangle}
          href="/alerts"
        />
      </div>

      {/* Security Score & Trend Chart */}
      <div className="grid gap-4 md:grid-cols-3">
        <SecurityScoreWidget 
          score={securityScore} 
          label="Based on scan success rate and alert severity"
        />
        <div className="md:col-span-2">
          <ScanTrendChart data={trendData} />
        </div>
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
                        {scan.scanType} · {formatDateShort(scan.startedAt)}
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
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Unable to load dashboard</h2>
          <p className="text-muted-foreground">
            There was an error loading your dashboard. Please try refreshing the page.
          </p>
          <p className="text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
}
