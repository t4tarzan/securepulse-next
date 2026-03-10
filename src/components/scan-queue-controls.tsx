"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pause, Play, StopCircle, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ScanQueueControls() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleAction(action: string, endpoint: string) {
    setLoading(action);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("pause", "/api/scan-queue/pause")}
        disabled={loading !== null}
      >
        {loading === "pause" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Pause className="h-4 w-4 mr-2" />
        )}
        Pause Queue
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("resume", "/api/scan-queue/resume")}
        disabled={loading !== null}
      >
        {loading === "resume" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        Resume
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("stop", "/api/scan-queue/stop-pending")}
        disabled={loading !== null}
      >
        {loading === "stop" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <StopCircle className="h-4 w-4 mr-2" />
        )}
        Stop Pending
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={loading !== null}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Scans?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all scan records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction("clear", "/api/scan-queue/clear")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All Scans
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
