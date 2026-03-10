"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface ClearAllReposButtonProps {
  count: number;
  type: "github" | "docker";
}

export function ClearAllReposButton({ count, type }: ClearAllReposButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClear() {
    setLoading(true);
    try {
      const endpoint = type === "github" 
        ? "/api/repos/github/clear-all" 
        : "/api/repos/docker/clear-all";
      
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(`Failed to clear ${type} repositories:`, error);
    } finally {
      setLoading(false);
    }
  }

  if (count === 0) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All {type === "github" ? "Repos" : "Images"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All {type === "github" ? "Repositories" : "Docker Images"}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all {count} {type === "github" ? "GitHub repositories" : "Docker images"} and their associated scan data. 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClear}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete All ${count} ${type === "github" ? "Repos" : "Images"}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
