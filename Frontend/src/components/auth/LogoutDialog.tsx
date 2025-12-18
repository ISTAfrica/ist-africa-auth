"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: (type: "single" | "all") => void;
  isLoading?: boolean;
}

export function LogoutDialog({
  open,
  onOpenChange,
  onLogout,
  isLoading = false,
}: LogoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Logout Options</DialogTitle>
          <DialogDescription>
            Choose how you want to logout from your account
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Logout on this device</h4>
            <p className="text-sm text-muted-foreground">
              You will be logged out only from this device. Your session on
              other devices will remain active.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => onLogout("single")}
              disabled={isLoading}
            >
              Logout on this device
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Logout on all devices</h4>
            <p className="text-sm text-muted-foreground">
              You will be logged out from all devices. You'll need to login
              again on each device.
            </p>
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => onLogout("all")}
              disabled={isLoading}
            >
              Logout on all devices
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
