"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, AppWindow } from "lucide-react";
import { toast } from "sonner";
import { MyApp, listMyApps } from "@/services/myApps";

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function colorFor(key: string) {
  // Stable pastel background keyed off the app name so each card has its
  // own fallback color when no favicon is available.
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function AppIcon({ app }: { app: MyApp }) {
  const [errored, setErrored] = useState(false);
  if (app.favicon_url && !errored) {
    return (
      <img
        src={app.favicon_url}
        alt=""
        width={48}
        height={48}
        onError={() => setErrored(true)}
        className="h-12 w-12 rounded-md bg-white object-contain p-1 border"
      />
    );
  }
  return (
    <div
      className="h-12 w-12 rounded-md flex items-center justify-center text-white font-semibold text-lg"
      style={{ backgroundColor: colorFor(app.name) }}
      aria-hidden
    >
      {initialsFor(app.name)}
    </div>
  );
}

export default function MyAppsPage() {
  const [apps, setApps] = useState<MyApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    listMyApps()
      .then((list) => {
        if (mounted) setApps(list);
      })
      .catch((e) => {
        if (mounted) toast.error(e instanceof Error ? e.message : "Failed to load apps");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Apps</h1>
        <p className="text-muted-foreground">
          Apps you have access to. Click any app to open it.
        </p>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AppWindow className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No apps available</p>
            <p className="text-sm text-muted-foreground mt-1">
              You don&apos;t have access to any apps yet. Contact your administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Card
              key={app.client_id}
              className="transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-3">
                  <AppIcon app={app} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{app.name}</h3>
                    {app.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {app.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-auto pt-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <a
                      href={app.home_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
