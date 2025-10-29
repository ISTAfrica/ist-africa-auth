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
import { getProfile, changePassword, updateProfile } from '@/services/authService';

// Define the structure of the user profile from the backend
type UserProfile = {
  id: number;
  name: string | null;
  email: string;
  createdAt: string;
  avatarUrl?: string;
};

// Mock session data (can be replaced with a real API call later)
const mockSessions = [
  { id: '1', device: 'Chrome on Windows', location: 'Nairobi, Kenya', ip: '102.68.xxx.xxx', lastActive: 'Active now', current: true, icon: Monitor },
  { id: '2', device: 'Safari on iPhone', location: 'Lagos, Nigeria', ip: '105.112.xxx.xxx', lastActive: '2 hours ago', current: false, icon: Smartphone },
  { id: '3', device: 'Firefox on macOS', location: 'Accra, Ghana', ip: '154.160.xxx.xxx', lastActive: '1 day ago', current: false, icon: Globe },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Edit Profile Dialog
  const [editedName, setEditedName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editError, setEditError] = useState('');

  // State for Change Password Dialog
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Refs to close dialogs programmatically
  const editDialogCloseRef = useRef<HTMLButtonElement>(null);
  const passwordDialogCloseRef = useRef<HTMLButtonElement>(null);

  // Fetch user profile data from the backend on component mount
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

  // Handler for the "Edit Profile" form
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

  // Handler for the "Change Password" form
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      return setPasswordError('New passwords do not match.');
    }
    if (newPassword.length < 8) {
        return setPasswordError('Password must be at least 8 characters long.');
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully!');
      
      setTimeout(() => {
        passwordDialogCloseRef.current?.click();
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordSuccess('');
      }, 1500);

    } catch (err: any) {
      setPasswordError(err.message || 'An error occurred.');
    } finally {
      setIsChangingPassword(false);
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

  // --- RENDER LOGIC ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Or a dedicated error/redirect component
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
                  <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" /> Change Photo</Button>
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
                        <form onSubmit={handlePasswordChange} className="space-y-4 py-4">
                          {passwordError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{passwordError}</AlertDescription></Alert>}
                          {passwordSuccess && <Alert className="border-green-500 bg-green-500/10 text-green-700"><CheckCircle className="h-4 w-4 text-green-500" /><AlertDescription>{passwordSuccess}</AlertDescription></Alert>}
                          <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                          </div>
                          <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isChangingPassword}>{isChangingPassword ? <Loader2 className="animate-spin" /> : 'Update Password'}</Button>
                          </DialogFooter>
                        </form>
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