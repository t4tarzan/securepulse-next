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
import { AcknowledgeButton, ResolveButton } from "@/components/alert-actions";

const severityColors: Record<string, string> = {
  critical: "destructive",
  high: "destructive",
  medium: "default",
  low: "secondary",
};

const severityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const alerts = await prisma.alert.findMany({
    where: {
      scan: {
        OR: [
          { githubRepo: { userId: user.id } },
          { dockerImage: { userId: user.id } },
        ],
      },
    },
    include: {
      scan: {
        include: {
          githubRepo: { select: { fullName: true } },
          dockerImage: { select: { imageName: true } },
        },
      },
      assignments: {
        include: { user: { select: { name: true, email: true } } },
      },
      resolution: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Sort by severity then date
  alerts.sort((a, b) => {
    const sev = (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
    if (sev !== 0) return sev;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const openAlerts = alerts.filter((a) => a.status === "open");
  const acknowledgedAlerts = alerts.filter((a) => a.status === "acknowledged");
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved");

  function AlertTable({ items, showActions }: { items: typeof alerts; showActions: boolean }) {
    if (items.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No alerts in this category.
        </div>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Severity</TableHead>
            <TableHead>Vulnerability</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Scan</TableHead>
            <TableHead>Date</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>
                <Badge variant={severityColors[alert.severity] as any ?? "outline"}>
                  {alert.severity}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[350px]">
                    {alert.description}
                  </p>
                  {alert.commit && (
                    <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate max-w-[350px]">
                      {alert.commit}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {alert.scan.githubRepo?.fullName ?? alert.scan.dockerImage?.imageName ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {alert.filePath ? (
                  <span title={alert.filePath} className="font-mono text-xs">
                    {alert.filePath.length > 30
                      ? "..." + alert.filePath.slice(-30)
                      : alert.filePath}
                    {alert.lineNumber ? `:${alert.lineNumber}` : ""}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {alert.scan.scanType}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {alert.createdAt.toLocaleDateString()}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {alert.status === "open" && (
                      <>
                        <AcknowledgeButton alertId={alert.id} />
                        <ResolveButton alertId={alert.id} />
                      </>
                    )}
                    {alert.status === "acknowledged" && (
                      <ResolveButton alertId={alert.id} />
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
        <p className="text-muted-foreground">
          Security vulnerabilities found in your repositories
        </p>
      </div>

      {/* Summary stats */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Badge variant="destructive">Critical</Badge>
          <span>{alerts.filter((a) => a.severity === "critical" && a.status !== "resolved").length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="destructive" className="bg-orange-500">High</Badge>
          <span>{alerts.filter((a) => a.severity === "high" && a.status !== "resolved").length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge>Medium</Badge>
          <span>{alerts.filter((a) => a.severity === "medium" && a.status !== "resolved").length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary">Low</Badge>
          <span>{alerts.filter((a) => a.severity === "low" && a.status !== "resolved").length}</span>
        </div>
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">
            Open <Badge variant="destructive" className="ml-1.5 text-xs">{openAlerts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged <Badge variant="secondary" className="ml-1.5 text-xs">{acknowledgedAlerts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved <Badge variant="outline" className="ml-1.5 text-xs">{resolvedAlerts.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="open">
          <Card>
            <CardContent className="p-0">
              <AlertTable items={openAlerts} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="acknowledged">
          <Card>
            <CardContent className="p-0">
              <AlertTable items={acknowledgedAlerts} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resolved">
          <Card>
            <CardContent className="p-0">
              <AlertTable items={resolvedAlerts} showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
