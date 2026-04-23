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
  Building2,
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
import {
  UserCompanyAssignment,
  AssignableCompany,
  listUserCompanies,
  assignUserCompanies,
  removeUserCompanies,
  listAssignableCompanies,
} from "@/services/userCompanies";
import { BulkAssignClientsModal } from "@/components/admin/BulkAssignClientsModal";
import { BulkAssignCompaniesModal } from "@/components/admin/BulkAssignCompaniesModal";

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

  const [companies, setCompanies] = useState<UserCompanyAssignment[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(
    new Set(),
  );
  const [addCompanyQuery, setAddCompanyQuery] = useState("");
  const [addCompanyResults, setAddCompanyResults] = useState<
    AssignableCompany[]
  >([]);
  const [addCompanySearching, setAddCompanySearching] = useState(false);
  const [bulkCompaniesOpen, setBulkCompaniesOpen] = useState(false);

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

  const fetchCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const list = await listUserCompanies(userId);
      setCompanies(list);
      setSelectedCompanyIds(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load companies");
    } finally {
      setCompaniesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (!addCompanyQuery.trim()) {
      setAddCompanyResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setAddCompanySearching(true);
      try {
        const r = await listAssignableCompanies(userId, addCompanyQuery, 8);
        setAddCompanyResults(r);
      } finally {
        setAddCompanySearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [addCompanyQuery, userId]);

  const handleAssignOneCompany = async (c: AssignableCompany) => {
    try {
      const r = await assignUserCompanies(userId, [c.id]);
      if (r.added > 0) {
        toast.success(`Assigned ${c.name}`);
      } else {
        toast.info(`${c.name} was already assigned`);
      }
      setAddCompanyQuery("");
      setAddCompanyResults([]);
      fetchCompanies();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign company");
    }
  };

  const handleRemoveOneCompany = async (a: UserCompanyAssignment) => {
    if (!confirm(`Remove ${user?.name || user?.email} from ${a.name}?`))
      return;
    try {
      await removeUserCompanies(userId, [a.companyId]);
      toast.success(`Removed from ${a.name}`);
      fetchCompanies();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove company");
    }
  };

  const handleRemoveSelectedCompanies = async () => {
    if (selectedCompanyIds.size === 0) return;
    if (!confirm(`Remove from ${selectedCompanyIds.size} company(s)?`)) return;
    try {
      const r = await removeUserCompanies(
        userId,
        Array.from(selectedCompanyIds),
      );
      toast.success(`Removed from ${r.removed} company(s)`);
      fetchCompanies();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove");
    }
  };

  const toggleSelectedCompany = (id: string) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllCompanies = () => {
    if (selectedCompanyIds.size === companies.length) {
      setSelectedCompanyIds(new Set());
    } else {
      setSelectedCompanyIds(new Set(companies.map((c) => c.companyId)));
    }
  };

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

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Companies ({companies.length})
              </CardTitle>
              <CardDescription>
                Companies this user is associated with.
              </CardDescription>
            </div>
            <Button onClick={() => setBulkCompaniesOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Bulk Assign
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search to assign a company (by name or slug)…"
                value={addCompanyQuery}
                onChange={(e) => setAddCompanyQuery(e.target.value)}
                className="pl-9"
              />
              {addCompanyQuery && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-72 overflow-auto">
                  {addCompanySearching ? (
                    <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                    </div>
                  ) : addCompanyResults.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      No matching companies (or all already assigned).
                    </div>
                  ) : (
                    addCompanyResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-accent border-b last:border-b-0 flex items-center justify-between gap-3"
                        onClick={() => handleAssignOneCompany(c)}
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{c.name}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {c.slug}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedCompanyIds.size > 0 && (
              <div className="flex items-center justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveSelectedCompanies}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove ({selectedCompanyIds.size})
                </Button>
              </div>
            )}

            {companiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No companies assigned yet.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <input
                          type="checkbox"
                          checked={
                            selectedCompanyIds.size === companies.length &&
                            companies.length > 0
                          }
                          onChange={toggleSelectAllCompanies}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((a) => (
                      <TableRow key={a.companyId}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedCompanyIds.has(a.companyId)}
                            onChange={() => toggleSelectedCompany(a.companyId)}
                            aria-label={`Select ${a.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {a.slug}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.description || "—"}
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
                            onClick={() => handleRemoveOneCompany(a)}
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

        <BulkAssignCompaniesModal
          open={bulkCompaniesOpen}
          onOpenChange={setBulkCompaniesOpen}
          userId={userId}
          userLabel={userLabel}
          onAssigned={fetchCompanies}
        />
      </div>
    </AdminLayout>
  );
}
