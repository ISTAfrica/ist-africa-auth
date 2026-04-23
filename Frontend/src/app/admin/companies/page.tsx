"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
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
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import {
  Company,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "@/services/companiesService";

import AdminLayout from "@/components/AdminLayout";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Create dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success banner
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setFetchError("");
        const data = await getCompanies();
        setCompanies(data);
      } catch (err: any) {
        setFetchError(err.message || "Failed to load companies");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  const resetCreateForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setFormError("");
    setIsDialogOpen(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const payload = {
        name: name.trim(),
        ...(slug.trim() && { slug: slug.trim() }),
        ...(description.trim() && { description: description.trim() }),
      };
      const created = await createCompany(payload);
      setCompanies((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSuccessMessage(`Company "${created.name}" created successfully.`);
      resetCreateForm();
    } catch (err: any) {
      setFormError(err.message || "Failed to create company");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (company: Company) => {
    setCompanyToEdit(company);
    setEditName(company.name);
    setEditSlug(company.slug);
    setEditDescription(company.description || "");
    setEditError("");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyToEdit) return;

    setIsSavingEdit(true);
    setEditError("");

    try {
      const payload = {
        name: editName.trim(),
        slug: editSlug.trim(),
        description: editDescription.trim(),
      };
      const updated = await updateCompany(companyToEdit.id, payload);
      setCompanies((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSuccessMessage(`Company "${updated.name}" updated successfully.`);
      setEditDialogOpen(false);
      setCompanyToEdit(null);
    } catch (err: any) {
      setEditError(err.message || "Failed to update company");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCompany(companyToDelete.id);
      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
      setSuccessMessage(`Company "${companyToDelete.name}" deleted successfully.`);
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (err: any) {
      setFetchError(err.message || "Failed to delete company");
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Companies</h2>
            <p className="text-muted-foreground">
              Manage companies that users and client apps can be associated with
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Company</DialogTitle>
                <DialogDescription>
                  Create a new company. The slug is auto-generated from the name if left blank.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 py-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="IST Academy"
                    required
                    minLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Slug (optional)</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ist-academy"
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers and hyphens only.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  {isSubmitting ? "Creating..." : "Create Company"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {successMessage && (
          <Alert className="border-green-600 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Companies</CardTitle>
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

            {!isLoading && !fetchError && companies.length === 0 && (
              <p className="text-center text-muted-foreground p-8">
                No companies yet. Create the first one above.
              </p>
            )}

            {!isLoading && !fetchError && companies.length > 0 && (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell className="font-mono text-sm">{company.slug}</TableCell>
                          <TableCell className="text-sm">{company.description || <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(company.created_at), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(company)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="md:hidden space-y-3">
                  {companies.map((company) => (
                    <div key={company.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{company.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(company.created_at), "yyyy-MM-dd")}
                        </p>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">{company.slug}</p>
                      {company.description && (
                        <p className="text-sm text-muted-foreground">{company.description}</p>
                      )}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(company)}>
                          <Edit className="h-4 w-4 mr-1" />Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(company)}>
                          <Trash2 className="h-4 w-4 mr-1 text-destructive" />Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
              <DialogDescription>Update the company details below.</DialogDescription>
            </DialogHeader>

            {editError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            {companyToEdit && (
              <form onSubmit={handleSaveEdit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
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
                    {isSavingEdit && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                    {isSavingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
              <DialogDescription>
                {companyToDelete
                  ? `You are about to delete "${companyToDelete.name}". This action cannot be undone.`
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
