"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConnectDockerButton() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleConnect() {
    if (!username.trim()) {
      setError("Please enter a Docker Hub username");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/repos/docker/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setOpen(false);
        setUsername("");
        router.refresh();
      } else {
        setError(data.error || "Failed to connect Docker Hub");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Container className="h-4 w-4 mr-2" />
          Connect Docker Hub
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Docker Hub</DialogTitle>
          <DialogDescription>
            Enter your Docker Hub username to discover and scan your public container images.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Docker Hub Username</Label>
            <Input
              id="username"
              placeholder="e.g., myusername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              We'll discover your public repositories and images for security scanning.
            </p>
          </div>
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
              {error}
            </div>
          )}
          <Button onClick={handleConnect} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Docker Hub"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
