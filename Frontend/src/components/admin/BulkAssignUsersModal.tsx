"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AssignableUser,
  listAssignableUsers,
  assignClientMembers,
} from "@/services/clientUsers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onAssigned: () => void;
}

export function BulkAssignUsersModal({
  open,
  onOpenChange,
  clientId,
  clientName,
  onAssigned,
}: Props) {
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<"all" | "ist" | "ext">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listAssignableUsers(clientId, q || undefined, 200);
      setUsers(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [clientId, q]);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setQ("");
    setFilterType("all");
    fetchUsers();
  }, [open, fetchUsers]);

  // Re-fetch when search changes (debounced)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(fetchUsers, 250);
    return () => clearTimeout(t);
  }, [q, open, fetchUsers]);

  const visible = users.filter((u) => {
    if (filterType === "ist") return u.membershipStatus === "ist_member";
    if (filterType === "ext") return u.membershipStatus === "ext_member";
    return true;
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const visibleIds = visible.map((u) => u.id);
    const allSelected = visibleIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const r = await assignClientMembers(clientId, Array.from(selected));
      toast.success(
        r.skipped
          ? `Added ${r.added}, ${r.skipped} were already members`
          : `Added ${r.added} user(s) to ${clientName}`,
      );
      onAssigned();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign");
    } finally {
      setSubmitting(false);
    }
  };

  const allVisibleSelected =
    visible.length > 0 && visible.every((u) => selected.has(u.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign users to {clientName}</DialogTitle>
          <DialogDescription>
            Showing only users not already assigned to this app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "ist", "ext"] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={filterType === t ? "default" : "outline"}
                  onClick={() => setFilterType(t)}
                >
                  {t === "all" ? "All" : t === "ist" ? "IST" : "External"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={selectAllVisible}
              />
              Select all visible ({visible.length})
            </label>
            <span className="text-muted-foreground">
              Selected: {selected.size}
            </span>
          </div>

          <div className="border rounded-md flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No users to assign.
              </div>
            ) : (
              <ul>
                {visible.map((u) => (
                  <li
                    key={u.id}
                    className="border-b last:border-b-0 hover:bg-accent"
                  >
                    <label className="flex items-center gap-3 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggle(u.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {u.name || u.email}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {u.membershipStatus === "ist_member" ? "IST" : "External"}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.size === 0 || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Assigning…
              </>
            ) : (
              `Assign ${selected.size}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
