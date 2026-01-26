"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from "@/components/ui";
import { Shield } from "lucide-react";

const mockSessions = [
  { id: 1, device: "Chrome on Windows", current: true, ip: "192.168.1.2", lastActive: "1 hour ago", icon: Shield },
  { id: 2, device: "Firefox on Mac", current: false, ip: "192.168.1.5", lastActive: "2 days ago", icon: Shield },
];

export default function SessionsPage() {
  const handleTerminateSession = (id: number) => {
    // terminate session logic
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield /> Active Sessions
        </CardTitle>
        <CardDescription>Manage devices where you're currently logged in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-start justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <session.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">{session.device}</p>
                  {session.current && <Badge variant="secondary" className="text-xs">Current</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{session.ip}</p>
                <p className="text-xs text-muted-foreground mt-1">{session.lastActive}</p>
              </div>
            </div>
            {!session.current && (
              <Button variant="outline" size="sm" onClick={() => handleTerminateSession(session.id)}>
                Terminate
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
