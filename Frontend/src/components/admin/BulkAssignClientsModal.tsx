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
  AssignableClient,
  listAssignableClients,
  assignUserClients,
} from "@/services/userClients";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userLabel: string;
  onAssigned: () => void;
}

export function BulkAssignClientsModal({
  open,
  onOpenChange,
  userId,
  userLabel,
  onAssigned,
}: Props) {
  const [clients, setClients] = useState<AssignableClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listAssignableClients(userId, q || undefined, 200);
      setClients(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load apps");
    } finally {
      setLoading(false);
    }
  }, [userId, q]);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setQ("");
    fetchClients();
  }, [open, fetchClients]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(fetchClients, 250);
    return () => clearTimeout(t);
  }, [q, open, fetchClients]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const visibleIds = clients.map((c) => c.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
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
      const r = await assignUserClients(userId, Array.from(selected));
      toast.success(
        r.skipped
          ? `Granted ${r.added}, ${r.skipped} were already granted`
          : `Granted ${r.added} app(s) to ${userLabel}`,
      );
      onAssigned();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to grant access");
    } finally {
      setSubmitting(false);
    }
  };

  const allVisibleSelected =
    clients.length > 0 && clients.every((c) => selected.has(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Grant app access to {userLabel}</DialogTitle>
          <DialogDescription>
            Showing only active apps not already granted to this user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by app name or description…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={selectAllVisible}
              />
              Select all visible ({clients.length})
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
            ) : clients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No apps to grant.
              </div>
            ) : (
              <ul>
                {clients.map((c) => (
                  <li
                    key={c.id}
                    className="border-b last:border-b-0 hover:bg-accent"
                  >
                    <label className="flex items-center gap-3 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{c.name}</div>
                        {c.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {c.description}
                          </div>
                        )}
                      </div>
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
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Granting…
              </>
            ) : (
              `Grant ${selected.size}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
