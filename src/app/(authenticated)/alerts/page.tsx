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

const severityColors: Record<string, string> = {
  critical: "destructive",
  high: "destructive",
  medium: "default",
  low: "secondary",
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
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const openAlerts = alerts.filter((a) => a.status === "open");
  const acknowledgedAlerts = alerts.filter((a) => a.status === "acknowledged");
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved");

  function AlertTable({ items }: { items: typeof alerts }) {
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
            <TableHead>Severity</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Scan Type</TableHead>
            <TableHead>Date</TableHead>
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
                  <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {alert.description}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {alert.scan.githubRepo?.fullName ?? alert.scan.dockerImage?.imageName ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {alert.filePath ? (
                  <span title={alert.filePath}>
                    {alert.filePath.split("/").pop()}
                    {alert.lineNumber ? `:${alert.lineNumber}` : ""}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {alert.scan.scanType}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {alert.createdAt.toLocaleDateString()}
              </TableCell>
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
          Security findings from your scans
        </p>
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
              <AlertTable items={openAlerts} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="acknowledged">
          <Card>
            <CardContent className="p-0">
              <AlertTable items={acknowledgedAlerts} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resolved">
          <Card>
            <CardContent className="p-0">
              <AlertTable items={resolvedAlerts} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
