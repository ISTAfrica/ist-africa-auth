"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
 Card,
 CardContent,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
 Plus,
 Edit,
 Trash2,
 Eye,
 Loader2,
 AlertCircle,
 Copy,
 CheckCircle,
 X,
 RefreshCcw,
} from "lucide-react";

import {
 Client,
 NewClientResponse,
 getClients,
 createClient,
 regenerateClientSecret,
 getClientById,
 updateClient,
 deleteClient,
} from "@/services/clientsService";

import AdminLayout from "@/components/AdminLayout";

export default function AdminClientsPage() {
 const router = useRouter();

 const [clients, setClients] = useState<Client[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [fetchError, setFetchError] = useState("");

 // Create Dialog State
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [formError, setFormError] = useState("");
 const [name, setName] = useState("");
 const [description, setDescription] = useState("");
 const [redirectUri, setRedirectUri] = useState("");
 const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
 const [originInput, setOriginInput] = useState("");
 const [newClient, setNewClient] = useState<NewClientResponse | null>(null);

 // Regenerate Secret Dialog State
 const [isRegenDialogOpen, setIsRegenDialogOpen] = useState(false);
 const [regeneratedSecret, setRegeneratedSecret] = useState<{
 client_id: string;
 client_secret: string;
} | null>(null);
 const [isRegenerating, setIsRegenerating] = useState(false);
 const [regenerateError, setRegenerateError] = useState("");
 const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
 const [selectedClientForRegen, setSelectedClientForRegen] = useState<{
 id: string;
 name: string;
} | null>(null);

 // View Dialog State
 const [viewDialogOpen, setViewDialogOpen] = useState(false);
 const [selectedClient, setSelectedClient] = useState<Client | null>(null);
 const [isLoadingClient, setIsLoadingClient] = useState(false);
 const [clientError, setClientError] = useState("");

 // Edit Dialog State
 const [editDialogOpen, setEditDialogOpen] = useState(false);
 const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
 const [isLoadingEdit, setIsLoadingEdit] = useState(false);
 const [isSavingEdit, setIsSavingEdit] = useState(false);
 const [editError, setEditError] = useState("");
 const [editName, setEditName] = useState("");
 const [editDescription, setEditDescription] = useState("");
 const [editRedirectUri, setEditRedirectUri] = useState("");
 const [editAllowedOrigins, setEditAllowedOrigins] = useState<string[]>([]);
 const [editOriginInput, setEditOriginInput] = useState("");

 // Delete Dialog State
 const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
 const [isDeletingClient, setIsDeletingClient] = useState(false);

 // Success Messages State
 const [updateSuccess, setUpdateSuccess] = useState(false);
 const [deleteSuccess, setDeleteSuccess] = useState(false);
 const [successMessage, setSuccessMessage] = useState("");

 useEffect(() => {
 const loadClients = async () => {
 try {
 setFetchError("");
 const data = await getClients();
 setClients(data);
 } catch (error: any) {
 setFetchError(error.message || "An unexpected error occurred.");
 } finally {
 setIsLoading(false);
 }
 };
 loadClients();
 }, []);

 useEffect(() => {
 if (updateSuccess || deleteSuccess) {
 const timer = setTimeout(() => {
 setUpdateSuccess(false);
 setDeleteSuccess(false);
 setSuccessMessage("");
 }, 5000);
 return () => clearTimeout(timer);
 }
 }, [updateSuccess, deleteSuccess]);

 const handleAddOrigin = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "Enter" && originInput.trim()) {
 e.preventDefault();
 if (!allowedOrigins.includes(originInput.trim())) {
 setAllowedOrigins([...allowedOrigins, originInput.trim()]);
 }
 setOriginInput("");
 }
 };

 const handleRemoveOrigin = (indexToRemove: number) => {
 setAllowedOrigins(
 allowedOrigins.filter((_, index) => index !== indexToRemove)
 );
 };

 const handleAddEditOrigin = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "Enter" && editOriginInput.trim()) {
 e.preventDefault();
 if (!editAllowedOrigins.includes(editOriginInput.trim())) {
 setEditAllowedOrigins([...editAllowedOrigins, editOriginInput.trim()]);
 }
 setEditOriginInput("");
 }
 };

 const handleRemoveEditOrigin = (indexToRemove: number) => {
 setEditAllowedOrigins(
 editAllowedOrigins.filter((_, index) => index !== indexToRemove)
 );
 };

 const handleView = async (client: Client) => {
 setViewDialogOpen(true);
 setIsLoadingClient(true);
 setClientError("");
 setSelectedClient(null);

 try {
 const fullClientData = await getClientById(client.id);
 setSelectedClient(fullClientData);
 } catch (error: any) {
 setClientError(error.message || "Failed to load client details");
 } finally {
 setIsLoadingClient(false);
 }
 };

 const handleEdit = async (client: Client) => {
 setEditDialogOpen(true);
 setEditError("");

 setClientToEdit(client);

 setEditName(client.name || "");
 setEditDescription(client.description || "");
 setEditRedirectUri(client.redirect_uri || "");
 setEditAllowedOrigins(
 Array.isArray(client.allowed_origins) ? client.allowed_origins : []
 );
 setEditOriginInput("");

 setIsLoadingEdit(false);
 };

 const handleSaveEdit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!clientToEdit) return;

 setIsSavingEdit(true);
 setEditError("");

 try {
 const payload = {
 name: editName,
 description: editDescription,
 redirect_uri: editRedirectUri,
 allowed_origins: editAllowedOrigins.filter(Boolean),
 };

 await updateClient(clientToEdit.id, payload);

 setClients((prev) =>
 prev.map((c) => (c.id === clientToEdit.id ? { ...c, ...payload } : c))
 );

 setEditDialogOpen(false);
 setClientToEdit(null);

 // Show success message
 setSuccessMessage(`Client "${editName}" has been updated successfully!`);
 setUpdateSuccess(true);
 } catch (error: any) {
 setEditError(error.message || "Failed to update client");
 } finally {
 setIsSavingEdit(false);
 }
 };

 const handleDelete = (client: Client) => {
 console.log("Deleting client with ID:", client.id);
 setClientToDelete(client);
 setDeleteDialogOpen(true);
 };

 const confirmDelete = async () => {
 if (!clientToDelete) return;

 console.log("🔵 Full client object:", clientToDelete);

 setIsDeletingClient(true);

 try {
 // The API expects the actual client_id or the ID string.
 const clientIdToDelete = clientToDelete.id; // Assuming ID is the unique identifier for delete API

 console.log("🔵 Sending to API:", clientIdToDelete);

 await deleteClient(clientIdToDelete);

 setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));

 const deletedClientName = clientToDelete.name;
 setDeleteDialogOpen(false);
 setClientToDelete(null);

 setSuccessMessage(
 `Client "${deletedClientName}" has been deleted successfully!`
 );
 setDeleteSuccess(true);
 } catch (error: any) {
 console.error("Delete error:", error);
 setDeleteDialogOpen(false);
 setClientToDelete(null);

 alert(error.message || "Failed to delete client");
 } finally {
 setIsDeletingClient(false);
 }
 };

 const handleCreateClient = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSubmitting(true);
 setFormError("");

 try {
 const payload = {
 name,
 description,
 redirect_uri: redirectUri,
 allowed_origins: allowedOrigins.filter(Boolean),
 };

 const result = await createClient(payload);
 setNewClient(result);
 setClients((prev) => [...prev, result]);
 } catch (error: any) {
 setFormError(error.message);
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleRegenerateClientSecret = async (clientId: string) => {
 setIsRegenerating(true);
 setRegenerateError("");

 try {
 const result = await regenerateClientSecret(clientId);

 setRegeneratedSecret(result);
 setIsRegenDialogOpen(true);
 setIsConfirmDialogOpen(false);

 setClients((prev) =>
 prev.map((c) =>
 c.id === clientId
 ? { ...c, updated_at: new Date().toISOString() } 
 : c
 )
 );
 } catch (error: any) {
 setRegenerateError(error.message || "Failed to regenerate secret");
 setIsConfirmDialogOpen(false);
 } finally {
 setIsRegenerating(false);
 }
 };

 const openConfirmDialog = (client: { id: string; name: string }) => {
 setSelectedClientForRegen({ id: client.id, name: client.name });
 setIsConfirmDialogOpen(true);
 };

 const resetForm = () => {
 setName("");
 setDescription("");
 setRedirectUri("");
 setAllowedOrigins([]);
 setOriginInput("");
 setFormError("");
 setNewClient(null);
 setIsDialogOpen(false);
 };

 const copyToClipboard = (text: string) => {
 navigator.clipboard.writeText(text);
 };

 const renderCreateDialogContent = () => {
 if (newClient) {
 return (
 <>
 <DialogHeader>
 <DialogTitle className="text-green-600">
 Client Created Successfully!
 </DialogTitle>
 <DialogDescription>
 Copy the Client ID & Secret now — you won't see the secret again.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <Alert className="border-green-600 bg-green-50 dark:bg-green-950/30">
 <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
 <AlertDescription className="text-green-800 dark:text-green-200">
 New client has been created successfully!
 </AlertDescription>
 </Alert>

 <div>
 <Label>Client ID</Label>
 <div className="flex items-center gap-2">
 <Input
 readOnly
 value={newClient.client_id}
 className="font-mono"
 />
 <Button
 variant="outline"
 size="icon"
 onClick={() => copyToClipboard(newClient.client_id)}
 >
 <Copy className="h-4 w-4" />
 </Button>
 </div>
 </div>

 <div>
 <Label>Client Secret</Label>
 <div className="flex items-center gap-2">
 <Input
 readOnly
 value={newClient.client_secret}
 className="font-mono"
 />
 <Button
 variant="outline"
 size="icon"
 onClick={() => copyToClipboard(newClient.client_secret)}
 >
 <Copy className="h-4 w-4" />
 </Button>
 </div>
 </div>
 </div>
 <Button onClick={resetForm} className="w-full">
 Done
 </Button>
 </>
 );
 }

 return (
 <>
 <DialogHeader>
 <DialogTitle>Register New Client</DialogTitle>
 <DialogDescription>
 Create a new OAuth2 client application.
 </DialogDescription>
 </DialogHeader>

 <form onSubmit={handleCreateClient} className="space-y-4 py-4">
 {formError && (
 <Alert variant="destructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>{formError}</AlertDescription>
 </Alert>
 )}
 <div className="space-y-2">
 <Label>Application Name</Label>
 <Input
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="My Awesome App"
 required
 />
 </div>

 <div className="space-y-2">
 <Label>Description</Label>
 <Input
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="A short description of the app"
 />
 </div>

 <div className="space-y-2">
 <Label>Redirect URI</Label>
 <Input
 value={redirectUri}
 onChange={(e) => setRedirectUri(e.target.value)}
 placeholder="https://app.example.com/callback"
 required
 />
 </div>

 <div className="space-y-2">
 <Label>Allowed Origins</Label>
 <div className="min-h-[42px] px-3 py-2 border border-input rounded-md focus-within:ring-2 focus-within:ring-ring bg-background">
 <div className="flex flex-wrap gap-2 items-center">
 {allowedOrigins.map((origin, index) => (
 <div
 key={index}
 className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm"
 >
 <span>{origin}</span>
 <button
 type="button"
 onClick={() => handleRemoveOrigin(index)}
 className="hover:bg-primary/20 rounded p-0.5 transition-colors"
 >
 <X size={14} />
 </button>
 </div>
 ))}
 <input
 type="text"
 value={originInput}
 onChange={(e) => setOriginInput(e.target.value)}
 onKeyDown={handleAddOrigin}
 placeholder={
 allowedOrigins.length === 0 ? "https://app.example.com" : ""
 }
 className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
 />
 </div>
 </div>
 <p className="text-xs text-muted-foreground">
 Press Enter to add each origin
 </p>
 </div>
 <Button type="submit" disabled={isSubmitting} className="w-full">
 {isSubmitting && <Loader2 className="animate-spin mr-2" />}
 {isSubmitting ? "Creating..." : "Create Client"}
 </Button>
 </form>
 </>
 );
 };

 return (
 <AdminLayout>
 <div className="space-y-6">
 </div>
 {/* HEADER */}
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-3xl font-bold">Client Management</h2>
 <p className="text-muted-foreground">
 Manage OAuth2 client applications
 </p>
 </div>

 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
 <DialogTrigger asChild>
 <Button onClick={() => setNewClient(null)}>
 <Plus className="mr-2 h-4 w-4" /> Register Client
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-md">
 {renderCreateDialogContent()}
 </DialogContent>
 </Dialog>
 </div>

 {/* SUCCESS ALERTS */}
 {updateSuccess && (
 <Alert className="border-green-600 bg-green-50 dark:bg-green-950/30">
 <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
 <AlertDescription className="text-green-800 dark:text-green-200">
 {successMessage}
 </AlertDescription>
 </Alert>
 )}

 {deleteSuccess && (
 <Alert className="border-green-600 bg-green-50 dark:bg-green-950/30">
 <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
 <AlertDescription className="text-green-800 dark:text-green-200">
 {successMessage}
 </AlertDescription>
 </Alert>
 )}

 {/* TABLE */}
 <Card>
 <CardHeader>
 <CardTitle>Registered Clients</CardTitle>
 </CardHeader>

 <CardContent>
 {isLoading && (
 <div className="text-center p-8">
 <Loader2 className="animate-spin h-8 w-8 mx-auto" />
 </div>
 )}

 {fetchError && (
 <Alert variant="destructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>{fetchError}</AlertDescription>
 </Alert>
 )}

 {regenerateError && (
 <Alert variant="destructive" className="mb-4">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>{regenerateError}</AlertDescription>
 </Alert>
 )}

 {!isLoading && !fetchError && clients.length === 0 && (
 <p className="text-center text-muted-foreground p-8">
 No clients registered yet.
 </p>
 )}

 {!isLoading && !fetchError && clients.length > 0 && (
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Name</TableHead>
 <TableHead>Client ID</TableHead>
 <TableHead>Redirect URI</TableHead>
 <TableHead>Created</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>

 <TableBody>
 {clients.map((client) => (
 <TableRow key={client.id}>
 <TableCell className="font-medium">{client.name}</TableCell>
 <TableCell className="font-mono text-sm">
 {client.client_id}
 </TableCell>
 <TableCell className="text-sm">
 {client.redirect_uri}
 </TableCell>
 <TableCell className="text-sm text-muted-foreground">
 {format(new Date(client.created_at), "yyyy-MM-dd")}
 </TableCell>

 <TableCell className="text-right">
 <div className="flex justify-end gap-2">
 <Button
 variant="ghost"
 size="icon"
 onClick={() => handleView(client)}
 >
 <Eye className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => handleEdit(client)}
 >
 <Edit className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 onClick={() =>
 openConfirmDialog({
 id: client.id,
 name: client.name,
 })
 }
 disabled={isRegenerating}
 >
 <RefreshCcw
 className={`h-4 w-4 ${
 isRegenerating ? "animate-spin" : ""
 }`}
 />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => handleDelete(client)}
 >
 <Trash2 className="h-4 w-4 text-destructive" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 )}
 </CardContent>
 </Card>

 {/* Confirm Regenerate Secret Dialog */}
 <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle>Regenerate Client Secret</DialogTitle>
 <DialogDescription>
 {selectedClientForRegen && (
 <>
 You are about to regenerate the secret for{" "}
 <span className="font-semibold text-foreground">
 {selectedClientForRegen.name}
 </span>
 . The old secret will no longer work.
 </>
 )}
 </DialogDescription>
 </DialogHeader>
 <div className="flex gap-3 justify-end pt-4" >
 <Button
 variant="outline"
 onClick={() => setIsConfirmDialogOpen(false)}
 disabled={isRegenerating}
 >
 Cancel
 </Button>

 <Button
 onClick={() =>
 selectedClientForRegen &&
 handleRegenerateClientSecret(selectedClientForRegen.id)
 }
 disabled={isRegenerating}
 >
 {isRegenerating && (
 <Loader2 className="animate-spin mr-2 h-4 w-4" />
 )}
 Confirm Regenerate
 </Button>
 </div>
 </DialogContent>
 </Dialog>

 {/* VIEW CLIENT DIALOG */}
 <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>Client Details</DialogTitle>
 <DialogDescription>
 View complete information for this OAuth2 client
 </DialogDescription>
 </DialogHeader>

 {isLoadingClient && (
 <div className="flex justify-center py-8">
 <Loader2 className="animate-spin h-8 w-8" />
 </div>
 )}

 {clientError && (
 <Alert variant="destructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>{clientError}</AlertDescription>
 </Alert>
 )}

 {selectedClient && !isLoadingClient && (
 <div className="space-y-4 py-4">
 <div>
 <Label className="text-sm font-semibold">Name</Label>
 <p className="text-sm mt-1">{selectedClient.name}</p>
 </div>

 <div>
 <Label className="text-sm font-semibold">Description</Label>
 <p className="text-sm mt-1">
 {selectedClient.description || "No description"}
 </p>
 </div>

 <div>
 <Label className="text-sm font-semibold">Client ID</Label>
 <div className="flex items-center gap-2 mt-1">
 <code className="text-sm flex-1 p-2 border rounded">
 {selectedClient.client_id}
 </code>
 <Button
 variant="outline"
 size="icon"
 onClick={() => copyToClipboard(selectedClient.client_id)}
 >
 <Copy className="h-4 w-4" />
 </Button>
 </div>
 </div>

 <div>
 <Label className="text-sm font-semibold">Redirect URI</Label>
 <p className="text-sm mt-1 font-mono">
 {selectedClient.redirect_uri}
 </p>
 </div>

 <div>
 <Label className="text-sm font-semibold">Allowed Origins</Label>
 <div className="mt-1 space-y-1">
 {selectedClient.allowed_origins?.map((origin, index) => (
 <p key={index} className="text-sm font-mono">
 {origin}
 </p>
 )) || <p className="text-sm">None</p>}
 </div>
 </div>

 <div>
 <Label className="text-sm font-semibold">Created At</Label>
 <p className="text-sm mt-1">
 {format(new Date(selectedClient.created_at), "PPpp")}
 </p>
 </div>

 {selectedClient.updated_at && (
 <div>
 <Label className="text-sm font-semibold">Updated At</Label>
 <p className="text-sm mt-1">
 {format(new Date(selectedClient.updated_at), "PPpp")}
 </p>
 </div>
 )}
 </div>
 
 )}

 <div className="flex justify-end gap-2 pt-4">
 <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
 Close
 </Button>
 </div>
 </DialogContent>
 </Dialog>

 {/* Regenerate Secret Success Dialog */}
 <Dialog open={isRegenDialogOpen} onOpenChange={setIsRegenDialogOpen}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle className="text-green-600 flex items-center gap-2">
 <CheckCircle className="h-5 w-5" />
 Secret Regenerated Successfully!
 </DialogTitle>
 <DialogDescription>
 Copy the new Client Secret now. You will not be able to see it
 again.
 </DialogDescription>
 </DialogHeader>

 {regeneratedSecret && (
 <div className="space-y-4 py-2">
 <Alert className="border-green-600 bg-green-50 dark:bg-green-950/30">
 <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
 <AlertDescription className="text-green-800 dark:text-green-200">
 New client secret has been generated successfully!
 </AlertDescription>
 </Alert>
 <div>
 <Label>Client ID</Label>
 <div className="flex items-center gap-2">
 <Input
 readOnly
 value={regeneratedSecret.client_id}
 className="font-mono border-gray-300"
 tabIndex={-1}
 />
 </div>
 </div>

 
 <div>
 <Label>New Client Secret</Label>
 <div className="flex items-center gap-2">
 <Input
 readOnly
 value={regeneratedSecret.client_secret}
 className="font-mono"
 onClick={(e) => e.currentTarget.select()}
 />
 <Button
 variant="outline"
 size="icon"
 onClick={() =>
 copyToClipboard(regeneratedSecret.client_secret)
 }
 >
 <Copy className="h-4 w-4" />
 </Button>
 </div>
 </div>
 
 </div>
 )}
 <Button
 onClick={() => {
 setIsRegenDialogOpen(false);
 setRegeneratedSecret(null);
 setRegenerateError("");
 }}
 className="w-full"
 >
 Done
 </Button>
 </DialogContent>
 </Dialog>
 
 {/* EDIT CLIENT DIALOG */}
 <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>Edit Client</DialogTitle>
 <DialogDescription>
 Update the client information below
 </DialogDescription>
 </DialogHeader>

 {isLoadingEdit && (
 <div className="flex justify-center py-8">
 <Loader2 className="animate-spin h-8 w-8" />
 </div>
 )}

 {editError && (
 <Alert variant="destructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>{editError}</AlertDescription>
 </Alert>
 )}

 {clientToEdit && !isLoadingEdit && (
 <form onSubmit={handleSaveEdit} className="space-y-4 py-4">
 <div className="space-y-2">
 <Label>Application Name</Label>
 <Input
 value={editName}
 onChange={(e) => setEditName(e.target.value)}
 placeholder="My Awesome App"
 required
 />
 </div>

 <div className="space-y-2">
 <Label>Description</Label>
 <Input
 value={editDescription}
 onChange={(e) => setEditDescription(e.target.value)}
 placeholder="A short description of the app"
 />
 </div>

 <div className="space-y-2">
 <Label>Client ID (Read-only)</Label>
 <Input
 value={clientToEdit.client_id}
 readOnly
 disabled
 className="font-mono bg-muted"
 />
 </div>

 <div className="space-y-2">
 <Label>Redirect URI</Label>
 <Input
 value={editRedirectUri}
 onChange={(e) => setEditRedirectUri(e.target.value)}
 placeholder="https://app.example.com/callback"
 required
 />
 </div>

 <div className="space-y-2">
 <Label>Allowed Origins</Label>
 <div className="min-h-[42px] px-3 py-2 border border-input rounded-md focus-within:ring-2 focus-within:ring-ring bg-background">
 <div className="flex flex-wrap gap-2 items-center">
 {editAllowedOrigins.map((origin, index) => (
 <div
 key={index}
 className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm"
 >
 <span>{origin}</span>
 <button
 type="button"
 onClick={() => handleRemoveEditOrigin(index)}
 className="hover:bg-primary/20 rounded p-0.5 transition-colors"
 >
 <X size={14} />
 </button>
 </div>
 ))}
 <input
 type="text"
 value={editOriginInput}
 onChange={(e) => setEditOriginInput(e.target.value)}
 onKeyDown={handleAddEditOrigin}
 placeholder={
 editAllowedOrigins.length === 0
 ? "https://app.example.com"
 : ""
 }
 className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
 />
 </div>
 </div>
 <p className="text-xs text-muted-foreground">
 Press Enter to add each origin
 </p>
 </div>

 <div className="flex justify-end gap-2 pt-4">
 <Button
 type="button"
 variant="outline"
 onClick={() => setEditDialogOpen(false)}
 disabled={isSavingEdit}
 >
 Cancel
 </Button>
 <Button type="submit" disabled={isSavingEdit}>
 {isSavingEdit && (
 <Loader2 className="animate-spin mr-2 h-4 w-4" />
 )}
 {isSavingEdit ? "Saving..." : "Save Changes"}
 </Button>
 </div>
 </form>
 )}
 </DialogContent>
 </Dialog>

 {/* DELETE CLIENT DIALOG */}
 <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle>Delete Client</DialogTitle>
 <DialogDescription>
 {clientToDelete
 ? `You are about to delete "${clientToDelete.name}". This action cannot be undone.`
 : ""}
 </DialogDescription>
 </DialogHeader>

 <div className="flex justify-end gap-3 pt-4">
 <Button
 variant="outline"
 onClick={() => setDeleteDialogOpen(false)}
 disabled={isDeletingClient}
 >
 Cancel
 </Button>

 <Button
 variant="destructive"
 onClick={confirmDelete}
 disabled={isDeletingClient}
 >
 {isDeletingClient && (
 <Loader2 className="animate-spin mr-2 h-4 w-4" />
 )}
 {isDeletingClient ? "Deleting..." : "Confirm Delete"}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </AdminLayout>
 );
}
