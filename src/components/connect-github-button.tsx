"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Plus } from "lucide-react";
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

export function ConnectGitHubButton() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleConnect() {
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/repos/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), label: label.trim() || "default" }),
      });
      const data = await res.json();
      if (res.ok) {
        setOpen(false);
        setToken("");
        router.refresh();
      } else {
        setError(data.error || "Failed to connect");
      }
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Connect GitHub
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect GitHub Account</DialogTitle>
          <DialogDescription>
            Add a GitHub Personal Access Token (PAT) to discover your repositories.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="token">GitHub PAT</Label>
            <Input
              id="token"
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              placeholder="e.g. personal, work"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleConnect} disabled={loading || !token.trim()}>
            {loading ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
