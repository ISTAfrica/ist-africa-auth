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
  UserPlus,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Client, getClientById } from "@/services/clientsService";
import {
  ClientMember,
  AssignableUser,
  listClientMembers,
  assignClientMembers,
  removeClientMembers,
  listAssignableUsers,
} from "@/services/clientUsers";
import { BulkAssignUsersModal } from "@/components/admin/BulkAssignUsersModal";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = decodeURIComponent(params.id);

  const [client, setClient] = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [clientError, setClientError] = useState("");

  const [members, setMembers] = useState<ClientMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<AssignableUser[]>([]);
  const [addSearching, setAddSearching] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);

  const fetchClient = useCallback(async () => {
    setClientLoading(true);
    setClientError("");
    try {
      const c = await getClientById(clientId);
      setClient(c);
    } catch (e) {
      setClientError(e instanceof Error ? e.message : "Failed to load client");
    } finally {
      setClientLoading(false);
    }
  }, [clientId]);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const list = await listClientMembers(clientId, memberSearch || undefined);
      setMembers(list);
      setSelectedIds(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setMembersLoading(false);
    }
  }, [clientId, memberSearch]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Search-to-add: debounced lookup of unassigned users
  useEffect(() => {
    if (!addQuery.trim()) {
      setAddResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setAddSearching(true);
      try {
        const r = await listAssignableUsers(clientId, addQuery, 8);
        setAddResults(r);
      } finally {
        setAddSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [addQuery, clientId]);

  const handleAddOne = async (user: AssignableUser) => {
    try {
      const r = await assignClientMembers(clientId, [user.id]);
      if (r.added > 0) {
        toast.success(`Added ${user.name || user.email}`);
      } else {
        toast.info(`${user.name || user.email} was already a member`);
      }
      setAddQuery("");
      setAddResults([]);
      fetchMembers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign user");
    }
  };

  const handleRemoveOne = async (m: ClientMember) => {
    if (!confirm(`Remove ${m.name || m.email} from ${client?.name}?`)) return;
    try {
      await removeClientMembers(clientId, [m.userId]);
      toast.success(`Removed ${m.name || m.email}`);
      fetchMembers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove user");
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Remove ${selectedIds.size} user(s) from ${client?.name}?`))
      return;
    try {
      const r = await removeClientMembers(clientId, Array.from(selectedIds));
      toast.success(`Removed ${r.removed} user(s)`);
      fetchMembers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove users");
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
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.userId)));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/clients")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Clients
          </Button>

          {clientLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading client...
            </div>
          ) : clientError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{clientError}</AlertDescription>
            </Alert>
          ) : client ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold">{client.name}</h1>
              <p className="text-sm text-muted-foreground">
                {client.description || "No description"}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {client.client_id}
              </p>
            </>
          ) : null}
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Members ({members.length})
              </CardTitle>
              <CardDescription>
                Users assigned to this app. Only assigned users can log in.
              </CardDescription>
            </div>
            <Button onClick={() => setBulkOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Bulk Assign
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search-to-add */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search to add a user (by name or email)…"
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
                      No matching users (or all already assigned).
                    </div>
                  ) : (
                    addResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-accent border-b last:border-b-0 flex items-center justify-between gap-3"
                        onClick={() => handleAddOne(u)}
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {u.name || u.email}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {u.email} · {u.membershipStatus}
                          </div>
                        </div>
                        <UserPlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Input
                placeholder="Filter members…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="max-w-xs"
              />
              {selectedIds.size > 0 && (
                <Button variant="destructive" size="sm" onClick={handleRemoveSelected}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remove ({selectedIds.size})
                </Button>
              )}
            </div>

            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members assigned yet.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === members.length && members.length > 0}
                          onChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.userId}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(m.userId)}
                            onChange={() => toggleSelected(m.userId)}
                            aria-label={`Select ${m.name || m.email}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{m.name || "—"}</TableCell>
                        <TableCell className="text-sm">{m.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.membershipStatus}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.assignedAt ? format(new Date(m.assignedAt), "yyyy-MM-dd") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOne(m)}
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

        <BulkAssignUsersModal
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          clientId={clientId}
          clientName={client?.name || ""}
          onAssigned={fetchMembers}
        />
      </div>
    </AdminLayout>
  );
}
