"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RotateCw, Loader2 } from "lucide-react";

interface RetryScanButtonProps {
  scanId: string;
}

export function RetryScanButton({ scanId }: RetryScanButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRetry() {
    setLoading(true);
    try {
      const res = await fetch(`/api/scans/${scanId}/retry`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to retry scan:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRetry}
      disabled={loading}
      className="h-7 text-xs"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RotateCw className="h-3 w-3" />
      )}
    </Button>
  );
}
