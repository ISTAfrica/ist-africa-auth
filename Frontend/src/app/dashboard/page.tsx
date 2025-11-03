'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Logo from '@/components/auth/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { 
  User, Lock, Shield, LogOut, CheckCircle,
  AlertCircle, Monitor, Smartphone, Globe, Edit, Loader2
} from 'lucide-react';
import { getProfile,updateProfile,uploadAvatar } from '@/services/authService';
import { changePassword } from '@/services/changePasswordService';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
type UserProfile = {
  id: number;
  name: string | null;
  email: string;
  createdAt: string;
  avatarUrl?: string;
};

const mockSessions = [
  { id: '1', device: 'Chrome on Windows', location: 'Nairobi, Kenya', ip: '102.68.xxx.xxx', lastActive: 'Active now', current: true, icon: Monitor },
  { id: '2', device: 'Safari on iPhone', location: 'Lagos, Nigeria', ip: '105.112.xxx.xxx', lastActive: '2 hours ago', current: false, icon: Smartphone },
  { id: '3', device: 'Firefox on macOS', location: 'Accra, Ghana', ip: '154.160.xxx.xxx', lastActive: '1 day ago', current: false, icon: Globe },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  
  const [editedName, setEditedName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editError, setEditError] = useState('');


  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const editDialogCloseRef = useRef<HTMLButtonElement>(null);
  const passwordDialogCloseRef = useRef<HTMLButtonElement>(null);

  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profileData = await getProfile();
        setUser(profileData);
        setEditedName(profileData.name || '');
      } catch (error) {
        console.error('Failed to fetch profile, redirecting...', error);
        router.push('/auth/login'); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setIsUpdatingProfile(true);
    
    try {
      const updatedUser = await updateProfile({ name: editedName });
      
      setUser(updatedUser);
      
      editDialogCloseRef.current?.click();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setAvatarError('');

    try {
      const updatedUser = await uploadAvatar(file);
      setUser(updatedUser); 
    } catch (err: any) {
      setAvatarError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/auth/login');
  };

  const handleTerminateSession = (sessionId: string) => {
    console.log('Terminating session:', sessionId);
  };

  

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and security preferences.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User /> Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={user.avatarUrl} alt={user.name || 'User'} />
                    <AvatarFallback className="text-2xl">
                      {user.name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? 'Uploading...' : 'Change Photo'}
                  </Button>
                  
                  {/* 3. Add a place to display any upload errors */}
                  {avatarError && <p className="text-sm text-destructive">{avatarError}</p>}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Full Name</Label>
                    <p className="text-foreground font-medium">{user.name}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground text-xs">Email Address</Label>
                    <p className="text-foreground font-medium">{user.email}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground text-xs">User ID</Label>
                    <p className="text-foreground font-mono text-sm">{user.id}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground text-xs">Member Since</Label>
                    <p className="text-foreground font-medium">{format(new Date(user.createdAt), 'MMMM d, yyyy')}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="default"><Edit className="h-4 w-4 mr-2" /> Edit Profile</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                          <DialogDescription>Update your personal information here.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleProfileUpdate} className="space-y-4 py-4">
                          {editError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{editError}</AlertDescription></Alert>}
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                          </div>
                          <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isUpdatingProfile}>
                              {isUpdatingProfile ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                            </Button>
                          </DialogFooter>
                        </form>
                        <DialogClose ref={editDialogCloseRef} className="hidden" />
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline"><Lock className="h-4 w-4 mr-2" /> Change Password</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
                        </DialogHeader>
                        <ChangePasswordForm />
                        <DialogClose ref={passwordDialogCloseRef} className="hidden" />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield /> Active Sessions</CardTitle>
              <CardDescription>Manage devices where you're currently logged in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockSessions.map((session) => (
                <div key={session.id} className="flex items-start justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10"><session.icon className="h-5 w-5 text-primary" /></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{session.device}</p>
                        {session.current && <Badge variant="secondary" className="text-xs">Current</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{session.location} • {session.ip}</p>
                      <p className="text-xs text-muted-foreground mt-1">{session.lastActive}</p>
                    </div>
                  </div>
                  {!session.current && <Button onClick={() => handleTerminateSession(session.id)} variant="outline" size="sm">Terminate</Button>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}