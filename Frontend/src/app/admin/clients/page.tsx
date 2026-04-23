"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation"; // Ensure useSearchParams is imported
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
  Users,
  Building2,
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
import {
  CompanyPublic,
  getPublicCompanies,
} from "@/services/companiesService";

import { extractAndStoreTokensFromURL } from "@/services/authService";
import AdminLayout from "@/components/AdminLayout";
import LinkedInPopupHandler from '@/components/LinkedInPopupHandler'; // <--- ADDED IMPORT

export default function AdminClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // This hook allows us to read URL parameters

  // =========================================================================
  // 1. POPUP INTERCEPTOR
  // If we have a token in the URL, render the Handler immediately.
  // This prevents the Admin Dashboard from flashing in the popup window.
  // =========================================================================
  const accessTokenParam = searchParams.get('accessToken');
  const errorParam = searchParams.get('error');

  if (accessTokenParam || errorParam) {
    return <LinkedInPopupHandler />;
  }
  // =========================================================================

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Companies (loaded once, reused by create + edit forms)
  const [availableCompanies, setAvailableCompanies] = useState<CompanyPublic[]>(
    []
  );

  // Create Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
  const [originInput, setOriginInput] = useState("");
  const [requiresCompany, setRequiresCompany] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
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
  const [editRequiresCompany, setEditRequiresCompany] = useState(false);
  const [editSelectedCompanyIds, setEditSelectedCompanyIds] = useState<string[]>(
    []
  );

  // Open-mode warning modal
  const [openWarningDialog, setOpenWarningDialog] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState<
    (() => Promise<void>) | null
  >(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  // Success Messages State
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Extract tokens from URL FIRST (from LinkedIn redirect)
  useEffect(() => {
    const tokensExtracted = extractAndStoreTokensFromURL();
    if (tokensExtracted) {
      // Logic if needed after extraction
    }
  }, []);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setFetchError("");
        const data = await getClients();
        setClients(data);
      } catch (error: any) {
        console.error("Failed to load clients:", error);
        setFetchError(error.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    getPublicCompanies()
      .then(setAvailableCompanies)
      .catch(() => setAvailableCompanies([]));
  }, []);

  const toggleCompanyId = (
    companyId: string,
    current: string[],
    setter: (next: string[]) => void
  ) => {
    if (current.includes(companyId)) {
      setter(current.filter((id) => id !== companyId));
    } else {
      setter([...current, companyId]);
    }
  };

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
    setIsLoadingEdit(true);
    setClientToEdit(client);

    setEditName(client.name || "");
    setEditDescription(client.description || "");
    setEditRedirectUri(client.redirect_uri || "");
    setEditAllowedOrigins(
      Array.isArray(client.allowed_origins) ? client.allowed_origins : []
    );
    setEditOriginInput("");
    setEditRequiresCompany(Boolean(client.requires_company));
    setEditSelectedCompanyIds(
      Array.isArray(client.company_ids) ? client.company_ids : []
    );

    // Fetch full client details (including company_ids) in case the row from list is stale
    try {
      const full = await getClientById(client.id);
      setClientToEdit(full);
      setEditRequiresCompany(Boolean(full.requires_company));
      setEditSelectedCompanyIds(
        Array.isArray(full.company_ids) ? full.company_ids : []
      );
    } catch {
      // Non-fatal: fall back to the row data we already have
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const performSaveEdit = async () => {
    if (!clientToEdit) return;
    setIsSavingEdit(true);
    setEditError("");

    try {
      if (editRequiresCompany && editSelectedCompanyIds.length === 0) {
        setEditError(
          "Pick at least one company, or turn off 'Requires company membership'."
        );
        return;
      }

      const payload = {
        name: editName,
        description: editDescription,
        redirect_uri: editRedirectUri,
        allowed_origins: editAllowedOrigins.filter(Boolean),
        requires_company: editRequiresCompany,
        company_ids: editSelectedCompanyIds,
      };

      const updated = await updateClient(clientToEdit.id, payload);

      setClients((prev) =>
        prev.map((c) => (c.id === clientToEdit.id ? { ...c, ...updated } : c))
      );

      setEditDialogOpen(false);
      setClientToEdit(null);

      setSuccessMessage(`Client "${editName}" has been updated successfully!`);
      setUpdateSuccess(true);
    } catch (error: any) {
      setEditError(error.message || "Failed to update client");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientToEdit) return;

    // Warning if this change would make the app open to all users
    const wasClosed = Boolean(clientToEdit.requires_company);
    const isNowOpen = !editRequiresCompany;
    if (wasClosed && isNowOpen) {
      setPendingSaveAction(() => performSaveEdit);
      setOpenWarningDialog(true);
      return;
    }

    await performSaveEdit();
  };

  const handleDelete = (client: Client) => {
    console.log("Deleting client with ID:", client.id);
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeletingClient(true);

    try {
      const clientIdToDelete = clientToDelete.id;
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

  const performCreate = async () => {
    setIsSubmitting(true);
    setFormError("");

    try {
      if (requiresCompany && selectedCompanyIds.length === 0) {
        setFormError(
          "Pick at least one company, or turn off 'Requires company membership'."
        );
        return;
      }

      // Include the current originInput if it exists and hasn't been added yet
      const finalOrigins: string[] = [...allowedOrigins];
      if (originInput.trim() && !allowedOrigins.includes(originInput.trim())) {
        finalOrigins.push(originInput.trim());
      }

      const payload = {
        name,
        description,
        redirect_uri: redirectUri,
        allowed_origins: finalOrigins.filter(Boolean),
        requires_company: requiresCompany,
        company_ids: selectedCompanyIds,
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

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();

    // Warn when creating an "open" app
    if (!requiresCompany) {
      setPendingSaveAction(() => performCreate);
      setOpenWarningDialog(true);
      return;
    }

    await performCreate();
  };

  const confirmOpenMode = async () => {
    const fn = pendingSaveAction;
    setOpenWarningDialog(false);
    setPendingSaveAction(null);
    if (fn) await fn();
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
    setRequiresCompany(false);
    setSelectedCompanyIds([]);
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

          <div className="space-y-2 border-t pt-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresCompany}
                onChange={(e) => setRequiresCompany(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="font-medium">Requires company membership</span>
                <span className="block text-xs text-muted-foreground">
                  When on, users must belong to at least one selected company
                  to log in. When off, the app is accessible to all users.
                </span>
              </span>
            </label>

            {requiresCompany && (
              <div className="mt-2 space-y-2">
                <Label>Companies this app serves</Label>
                {availableCompanies.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No companies yet. Create one first under Admin → Companies.
                  </p>
                ) : (
                  <div className="border rounded-md max-h-48 overflow-auto divide-y">
                    {availableCompanies.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCompanyIds.includes(c.id)}
                          onChange={() =>
                            toggleCompanyId(
                              c.id,
                              selectedCompanyIds,
                              setSelectedCompanyIds
                            )
                          }
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {c.name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {c.slug}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
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
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Client Management</h2>
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

          <CardContent className="overflow-x-auto">
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
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
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
                          <TableCell className="font-mono text-sm">{client.client_id}</TableCell>
                          <TableCell className="text-sm">{client.redirect_uri}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(client.created_at), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleView(client)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" title="Manage members" onClick={() => router.push(`/admin/clients/${encodeURIComponent(client.id)}`)}><Users className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => openConfirmDialog({ id: client.id, name: client.name })} disabled={isRegenerating}>
                                <RefreshCcw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(client)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {clients.map((client) => (
                    <div key={client.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(client.created_at), "yyyy-MM-dd")}
                        </p>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground break-all">{client.client_id}</p>
                      <p className="text-xs text-muted-foreground break-all">{client.redirect_uri}</p>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="ghost" size="sm" onClick={() => handleView(client)}><Eye className="h-4 w-4 mr-1" />View</Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/clients/${encodeURIComponent(client.id)}`)}><Users className="h-4 w-4 mr-1" />Members</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => openConfirmDialog({ id: client.id, name: client.name })} disabled={isRegenerating}>
                          <RefreshCcw className={`h-4 w-4 mr-1 ${isRegenerating ? "animate-spin" : ""}`} />Key
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(client)}><Trash2 className="h-4 w-4 mr-1 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
            <div className="flex gap-3 justify-end pt-4">
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
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Company access
                  </Label>
                  <div className="mt-1 space-y-1">
                    {selectedClient.requires_company ? (
                      <>
                        <p className="text-sm">
                          Requires membership in one of these companies:
                        </p>
                        {selectedClient.company_ids?.length ? (
                          <ul className="text-sm list-disc ml-5">
                            {selectedClient.company_ids.map((id) => {
                              const c = availableCompanies.find(
                                (x) => x.id === id
                              );
                              return (
                                <li key={id}>
                                  {c ? `${c.name} (${c.slug})` : id}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No companies selected (this app cannot be logged
                            into until at least one is picked).
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Open to all users — no company membership required.
                      </p>
                    )}
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

                <div className="space-y-2 border-t pt-4">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editRequiresCompany}
                      onChange={(e) =>
                        setEditRequiresCompany(e.target.checked)
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium">
                        Requires company membership
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        When on, users must belong to at least one selected
                        company to log in. When off, the app is accessible to
                        all users.
                      </span>
                    </span>
                  </label>

                  {editRequiresCompany && (
                    <div className="mt-2 space-y-2">
                      <Label>Companies this app serves</Label>
                      {availableCompanies.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No companies yet. Create one first under Admin →
                          Companies.
                        </p>
                      ) : (
                        <div className="border rounded-md max-h-48 overflow-auto divide-y">
                          {availableCompanies.map((c) => (
                            <label
                              key={c.id}
                              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent"
                            >
                              <input
                                type="checkbox"
                                checked={editSelectedCompanyIds.includes(c.id)}
                                onChange={() =>
                                  toggleCompanyId(
                                    c.id,
                                    editSelectedCompanyIds,
                                    setEditSelectedCompanyIds
                                  )
                                }
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {c.name}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono truncate">
                                  {c.slug}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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

        {/* OPEN-MODE WARNING DIALOG */}
        <Dialog
          open={openWarningDialog}
          onOpenChange={(open) => {
            if (!open) setPendingSaveAction(null);
            setOpenWarningDialog(open);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Make this app open to all users?
              </DialogTitle>
              <DialogDescription>
                With &quot;Requires company membership&quot; turned off, any
                registered user will be able to log into this app regardless of
                their company. Is that what you want?
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenWarningDialog(false);
                  setPendingSaveAction(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={confirmOpenMode}>
                Yes, make it open
              </Button>
            </div>
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
      </div>
    </AdminLayout>
  );
}