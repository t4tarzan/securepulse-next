"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ClickableStatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
}

export function ClickableStatCard({ title, value, subtitle, icon: Icon, href }: ClickableStatCardProps) {
  const router = useRouter();

  return (
    <Card 
      className="cursor-pointer transition-colors hover:bg-muted/50" 
      onClick={() => router.push(href)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
