"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Edit, Lock, Unlock, AppWindow } from "lucide-react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import {
  fetchUsers,
  updateUserStatus,
  updateUserRole,
  User,
} from "@/services/users";
import { format } from "date-fns";

const AdminUsers = () => {
  const { toast } = useToast();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(
    null
  );
  const [reason, setReason] = useState("");

  useEffect(() => {
    // Get logged-in user ID safely on client
    const userId = storage.get("userId");
    setLoggedInUserId(userId);

    const loadUsers = async () => {
      try {
        const data = await fetchUsers(); // no token required
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    };

    loadUsers();
  }, [toast]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = (user: User) => {
    // Prevent changing status for own account
    if (String(user.id) === String(loggedInUserId)) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot change your own account status.",
        variant: "destructive",
      });
      return;
    }
    setSelectedUser(user);
    setStatusDialogOpen(true);
  };

  const handleRoleChange = (user: User) => {
    // Prevent changing role for own account
    if (String(user.id) === String(loggedInUserId)) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot change your own role.",
        variant: "destructive",
      });
      return;
    }
    setSelectedUserForRole(user);
    setRoleDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedUser) return;
    const user = selectedUser;
    const newIsActive = !user.isActive;
    const currentReason = reason;

    // Close dialog immediately
    setStatusDialogOpen(false);
    setSelectedUser(null);
    setReason("");

    try {
      await updateUserStatus(user.id, newIsActive, currentReason);
      const refreshedUsers = await fetchUsers();
      setUsers(refreshedUsers);
      toast({
        title: "Status Updated",
        description: `User ${user.name} has been ${newIsActive ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const confirmRoleChange = async () => {
    if (!selectedUserForRole) return;
    const user = selectedUserForRole;
    const newRole = user.role === "user" ? "admin" : "user";

    setRoleDialogOpen(false);
    setSelectedUserForRole(null);

    try {
      await updateUserRole(user.id, newRole);
      const refreshedUsers = await fetchUsers();
      setUsers(refreshedUsers);
      toast({
        title: "Role Updated",
        description: `User ${user.name}'s role changed to ${newRole}`,
      });
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update role";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            User Management
          </h2>
          <p className="text-muted-foreground">
            Manage and monitor user accounts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>
              Search and manage all registered users
            </CardDescription>
            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const isCurrentUser = String(user.id) === String(loggedInUserId);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.name}
                            {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "destructive"}>
                            {user.isActive ? "active" : "inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(user.createdAt), "yyyy-MM-dd")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/users/${encodeURIComponent(user.id)}`)} title="Manage app access">
                              <AppWindow className="h-4 w-4" />
                            </Button>
                            {!isCurrentUser && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleRoleChange(user)} title="Change role">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleStatusChange(user)} title={user.isActive ? "Deactivate user" : "Activate user"}>
                                  {user.isActive ? <Lock className="h-4 w-4 text-destructive" /> : <Unlock className="h-4 w-4 text-success" />}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((user) => {
                const isCurrentUser = String(user.id) === String(loggedInUserId);
                return (
                  <div key={user.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">{user.role}</Badge>
                        <Badge variant={user.isActive ? "default" : "destructive"} className="text-xs">
                          {user.isActive ? "active" : "inactive"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-xs text-muted-foreground">{format(new Date(user.createdAt), "yyyy-MM-dd")}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users/${encodeURIComponent(user.id)}`)}>
                          <AppWindow className="h-4 w-4 mr-1" />Apps
                        </Button>
                        {!isCurrentUser && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleRoleChange(user)}>
                              <Edit className="h-4 w-4 mr-1" />Role
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(user)}>
                              {user.isActive ? <Lock className="h-4 w-4 mr-1 text-destructive" /> : <Unlock className="h-4 w-4 mr-1" />}
                              {user.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser?.isActive ? "Deactivate" : "Activate"} User
              </DialogTitle>
              <DialogDescription>
                You are about to{" "}
                {selectedUser?.isActive ? "deactivate" : "activate"}{" "}
                {selectedUser?.name}. Please provide a reason for this action.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for this action..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusDialogOpen(false);
                  setSelectedUser(null);
                  setReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmStatusChange}
                variant={selectedUser?.isActive ? "destructive" : "default"}
              >
                Confirm {selectedUser?.isActive ? "Deactivation" : "Activation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                You are about to change {selectedUserForRole?.name}'s role from{" "}
                {selectedUserForRole?.role} to{" "}
                {selectedUserForRole?.role === "user" ? "admin" : "user"}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRoleDialogOpen(false);
                  setSelectedUserForRole(null);
                  setReason("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={confirmRoleChange}>Confirm Role Change</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
