'use client';

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Edit, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchUsers, updateUserStatus, updateUserRole, User } from "@/services/users";

const AdminUsers = () => {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  const [reason, setReason] = useState("");

  // Fetch users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ---------------- Status Change ----------------
  const handleStatusChange = (user: User) => {
    setSelectedUser(user);
    setStatusDialogOpen(true);
  };

const confirmStatusChange = async () => {
  if (!selectedUser) return;

  try {
    const newIsActive = !selectedUser.isActive;

    // Call backend to update status with reason
    const updatedUser = await updateUserStatus(
      selectedUser.id,
      newIsActive,
      reason
    );

    // Update frontend state
    setUsers(prev =>
      prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, isActive: updatedUser.isActive, statusReason: updatedUser.statusReason }
          : u
      )
    );

    // Show toast
    toast({
      title: "Status Updated",
      description: `User ${updatedUser.name} has been ${updatedUser.isActive ? "activated" : "suspended"}${updatedUser.statusReason ? `. Reason: ${updatedUser.statusReason}` : ''}`,
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: "Failed to update user status",
      variant: "destructive",
    });
  } finally {
    // Reset dialog state
    setStatusDialogOpen(false);
    setSelectedUser(null);
    setReason("");
  }
};


  const closeDialog = () => {
    setStatusDialogOpen(false);
    setSelectedUser(null);
    setReason("");
  };

  // ---------------- Role Change ----------------
  const handleRoleChange = (user: User) => {
    setSelectedUserForRole(user);
    setRoleDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUserForRole) return;

    try {
      const newRole = selectedUserForRole.role === "user" ? "admin" : "user";
      await updateUserRole(selectedUserForRole.id, newRole);

      setUsers(prev =>
        prev.map(u => (u.id === selectedUserForRole.id ? { ...u, role: newRole } : u))
      );

      toast({
        title: "Role Updated",
        description: `User ${selectedUserForRole.name}'s role has been changed to ${newRole}${reason ? `. Reason: ${reason}` : ''}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }

    setRoleDialogOpen(false);
    setSelectedUserForRole(null);
    setReason("");
  };

  const closeRoleDialog = () => {
    setRoleDialogOpen(false);
    setSelectedUserForRole(null);
    setReason("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage and monitor user accounts</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>Search and manage all registered users</CardDescription>
            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "active" : "suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.createdAt}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleRoleChange(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleStatusChange(user)}>
                          {user.isActive ? (
                            <Lock className="h-4 w-4 text-destructive" />
                          ) : (
                            <Unlock className="h-4 w-4 text-success" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedUser?.isActive ? "Suspend" : "Activate"} User</DialogTitle>
              <DialogDescription>
                You are about to {selectedUser?.isActive ? "suspend" : "activate"} {selectedUser?.name}.
                Please provide a reason for this action.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for this action..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button
                onClick={confirmStatusChange}
                variant={selectedUser?.isActive ? "destructive" : "default"}
              >
                Confirm {selectedUser?.isActive ? "Suspension" : "Activation"}
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
                You are about to change {selectedUserForRole?.name}'s role from {selectedUserForRole?.role} to {selectedUserForRole?.role === "user" ? "admin" : "user"}.
                Please provide a reason for this action.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeRoleDialog}>Cancel</Button>
              <Button onClick={confirmRoleChange}>Confirm Role Change</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
