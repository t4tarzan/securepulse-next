"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface ScanTabsProps {
  allCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  children: React.ReactNode;
}

export function ScanTabs({ allCount, runningCount, completedCount, failedCount, children }: ScanTabsProps) {
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList>
        <TabsTrigger value="all">
          All <Badge variant="secondary" className="ml-1.5 text-xs">{allCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="running">
          Running <Badge variant="outline" className="ml-1.5 text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">{runningCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed <Badge variant="outline" className="ml-1.5 text-xs bg-green-500/10 text-green-500 border-green-500/20">{completedCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="failed">
          Failed <Badge variant="destructive" className="ml-1.5 text-xs">{failedCount}</Badge>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
