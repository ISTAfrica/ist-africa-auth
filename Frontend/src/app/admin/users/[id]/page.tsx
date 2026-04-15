"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  Search,
  AppWindow,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { fetchUser, User } from "@/services/users";
import {
  UserClientAssignment,
  AssignableClient,
  listUserClients,
  assignUserClients,
  removeUserClients,
  listAssignableClients,
} from "@/services/userClients";
import { BulkAssignClientsModal } from "@/components/admin/BulkAssignClientsModal";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = decodeURIComponent(params.id);

  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState("");

  const [apps, setApps] = useState<UserClientAssignment[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<AssignableClient[]>([]);
  const [addSearching, setAddSearching] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);

  const fetchUserData = useCallback(async () => {
    setUserLoading(true);
    setUserError("");
    try {
      const u = await fetchUser(userId);
      setUser(u);
    } catch (e) {
      setUserError(e instanceof Error ? e.message : "Failed to load user");
    } finally {
      setUserLoading(false);
    }
  }, [userId]);

  const fetchApps = useCallback(async () => {
    setAppsLoading(true);
    try {
      const list = await listUserClients(userId);
      setApps(list);
      setSelectedIds(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load apps");
    } finally {
      setAppsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    if (!addQuery.trim()) {
      setAddResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setAddSearching(true);
      try {
        const r = await listAssignableClients(userId, addQuery, 8);
        setAddResults(r);
      } finally {
        setAddSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [addQuery, userId]);

  const handleGrantOne = async (c: AssignableClient) => {
    try {
      const r = await assignUserClients(userId, [c.id]);
      if (r.added > 0) {
        toast.success(`Granted access to ${c.name}`);
      } else {
        toast.info(`${c.name} was already granted`);
      }
      setAddQuery("");
      setAddResults([]);
      fetchApps();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to grant access");
    }
  };

  const handleRevokeOne = async (a: UserClientAssignment) => {
    if (!confirm(`Revoke ${user?.name || user?.email}'s access to ${a.name}?`))
      return;
    try {
      await removeUserClients(userId, [a.clientId]);
      toast.success(`Revoked access to ${a.name}`);
      fetchApps();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke access");
    }
  };

  const handleRevokeSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Revoke access to ${selectedIds.size} app(s)?`)) return;
    try {
      const r = await removeUserClients(userId, Array.from(selectedIds));
      toast.success(`Revoked access to ${r.removed} app(s)`);
      fetchApps();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke");
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === apps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(apps.map((a) => a.clientId)));
    }
  };

  const userLabel = user?.name || user?.email || userId;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/users")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
          </Button>

          {userLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading user...
            </div>
          ) : userError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{userError}</AlertDescription>
            </Alert>
          ) : user ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {user.name || user.email}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                <span>Role: {user.role}</span>
                <span>·</span>
                <span>
                  Status: {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {user.role === "admin" && (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This user is an IAA admin and has access to all apps. Explicit
                    assignments below are not required for login.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : null}
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AppWindow className="h-5 w-5" /> App Access ({apps.length})
              </CardTitle>
              <CardDescription>
                Apps this user can log into.
              </CardDescription>
            </div>
            <Button onClick={() => setBulkOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Bulk Grant
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search to grant an app (by name or description)…"
                value={addQuery}
                onChange={(e) => setAddQuery(e.target.value)}
                className="pl-9"
              />
              {addQuery && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-72 overflow-auto">
                  {addSearching ? (
                    <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                    </div>
                  ) : addResults.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      No matching apps (or all already granted).
                    </div>
                  ) : (
                    addResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-accent border-b last:border-b-0 flex items-center justify-between gap-3"
                        onClick={() => handleGrantOne(c)}
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{c.name}</div>
                          {c.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {c.description}
                            </div>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-end">
                <Button variant="destructive" size="sm" onClick={handleRevokeSelected}>
                  <Trash2 className="h-4 w-4 mr-1" /> Revoke ({selectedIds.size})
                </Button>
              </div>
            )}

            {appsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No app access granted yet.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === apps.length && apps.length > 0}
                          onChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>App</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Granted</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apps.map((a) => (
                      <TableRow key={a.clientId}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(a.clientId)}
                            onChange={() => toggleSelected(a.clientId)}
                            aria-label={`Select ${a.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.description || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.status}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.assignedAt
                            ? format(new Date(a.assignedAt), "yyyy-MM-dd")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevokeOne(a)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <BulkAssignClientsModal
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          userId={userId}
          userLabel={userLabel}
          onAssigned={fetchApps}
        />
      </div>
    </AdminLayout>
  );
}
