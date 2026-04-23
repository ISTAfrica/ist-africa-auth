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
  AssignableCompany,
  listAssignableCompanies,
  assignUserCompanies,
} from "@/services/userCompanies";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userLabel: string;
  onAssigned: () => void;
}

export function BulkAssignCompaniesModal({
  open,
  onOpenChange,
  userId,
  userLabel,
  onAssigned,
}: Props) {
  const [companies, setCompanies] = useState<AssignableCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listAssignableCompanies(userId, q || undefined, 200);
      setCompanies(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [userId, q]);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setQ("");
    fetchCompanies();
  }, [open, fetchCompanies]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(fetchCompanies, 250);
    return () => clearTimeout(t);
  }, [q, open, fetchCompanies]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const visibleIds = companies.map((c) => c.id);
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
      const r = await assignUserCompanies(userId, Array.from(selected));
      toast.success(
        r.skipped
          ? `Assigned ${r.added}, ${r.skipped} were already assigned`
          : `Assigned ${r.added} company(s) to ${userLabel}`,
      );
      onAssigned();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign companies");
    } finally {
      setSubmitting(false);
    }
  };

  const allVisibleSelected =
    companies.length > 0 && companies.every((c) => selected.has(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign companies to {userLabel}</DialogTitle>
          <DialogDescription>
            Showing only companies not already assigned to this user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug…"
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
              Select all visible ({companies.length})
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
            ) : companies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No companies to assign.
              </div>
            ) : (
              <ul>
                {companies.map((c) => (
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
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {c.slug}
                        </div>
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
