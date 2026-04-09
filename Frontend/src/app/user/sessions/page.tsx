"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from "@/components/ui";
import { Shield, Monitor, Smartphone, Tablet, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";

interface Session {
  id: number;
  device: string;
  deviceType: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
}

const deviceIcons: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchSessions = useCallback(async () => {
    try {
      const data = await apiClient<Session[]>("/api/auth/sessions");
      setSessions(data);
    } catch {
      setError("Failed to load sessions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleTerminateSession = async (id: number) => {
    setTerminatingId(id);
    try {
      await apiClient(`/api/auth/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Failed to terminate session.");
    } finally {
      setTerminatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield /> Active Sessions
        </CardTitle>
        <CardDescription>
          Manage devices where you&apos;re currently logged in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {sessions.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        )}

        {sessions.map((session, index) => {
          const Icon = deviceIcons[session.deviceType] || Monitor;
          const isCurrent = index === 0;

          return (
            <div
              key={session.id}
              className="flex items-start justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">{session.device}</p>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{session.ipAddress}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isCurrent
                      ? "Active now"
                      : formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {!isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTerminateSession(session.id)}
                  disabled={terminatingId === session.id}
                >
                  {terminatingId === session.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Terminate"
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
