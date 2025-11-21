'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, AlertCircle, Copy } from 'lucide-react';
import { Client, NewClientResponse, getClients, createClient } from '@/services/clientsService';
import AdminLayout from '@/components/AdminLayout'; 

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [newClient, setNewClient] = useState<NewClientResponse | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadClients = async () => {
      try {
        setFetchError('');
        const data = await getClients();
        setClients(data);
      } catch (error: any) {
        setFetchError(error.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    loadClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        name,
        description,
        redirect_uri: redirectUri,
        allowed_origins: allowedOrigins.split(',').map(origin => origin.trim()).filter(Boolean),
      };
      const result = await createClient(payload);
      setNewClient(result); 
      setClients(prev => [...prev, result]); 
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setRedirectUri('');
    setAllowedOrigins('');
    setFormError('');
    setNewClient(null);
    setIsDialogOpen(false);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderDialogContent = () => {
    if (newClient) {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="text-green-600">Client Created Successfully!</DialogTitle>
            <DialogDescription>
              Please copy the Client ID and Client Secret. You will not be able to see the secret again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Client ID</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={newClient.client_id} className="font-mono"/>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(newClient.client_id)}><Copy className="h-4 w-4"/></Button>
              </div>
            </div>
            <div>
              <Label>Client Secret</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={newClient.client_secret} className="font-mono"/>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(newClient.client_secret)}><Copy className="h-4 w-4"/></Button>
              </div>
            </div>
          </div>
          <Button onClick={resetForm} className="w-full">Done</Button>
        </>
      );
    }

    return (
      <>
        <DialogHeader>
          <DialogTitle>Register New Client</DialogTitle>
          <DialogDescription>Create a new OAuth2 client application.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateClient} className="space-y-4 py-4">
          {formError && <Alert variant="destructive"><AlertCircle className="h-4 w-4"/><AlertDescription>{formError}</AlertDescription></Alert>}
          <div className="space-y-2">
            <Label htmlFor="client-name">Application Name</Label>
            <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome App" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of the app" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="redirect-uri">Redirect URI</Label>
            <Input id="redirect-uri" type="url" value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} placeholder="https://app.example.com/callback" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allowed-origins">Allowed Origins</Label>
            <Input id="allowed-origins" value={allowedOrigins} onChange={(e) => setAllowedOrigins(e.target.value)} placeholder="https://app.example.com, https://www.example.com" required />
            <p className="text-xs text-muted-foreground">Comma-separated list of URLs.</p>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
            {isSubmitting ? 'Creating...' : 'Create Client'}
          </Button>
        </form>
      </>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Client Management</h2>
            <p className="text-muted-foreground">Manage OAuth2 client applications</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setNewClient(null)}>
                <Plus className="mr-2 h-4 w-4" /> Register Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              {renderDialogContent()}
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Clients</CardTitle>
            <CardDescription>View and manage your OAuth client applications.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="text-center p-8"><Loader2 className="animate-spin h-8 w-8 mx-auto"/></div>}
            {fetchError && <Alert variant="destructive"><AlertCircle className="h-4 w-4"/><AlertDescription>{fetchError}</AlertDescription></Alert>}
            {!isLoading && !fetchError && clients.length === 0 && <p className="text-center text-muted-foreground p-8">No clients registered yet.</p>}
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
                      <TableCell className="font-mono text-sm">{client.client_id}</TableCell>
                      <TableCell className="text-sm">{client.redirect_uri}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(client.created_at), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
