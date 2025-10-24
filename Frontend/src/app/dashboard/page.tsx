'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/auth/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, Lock, Shield, LogOut, CheckCircle,
  AlertCircle, Monitor, Smartphone, Globe
} from 'lucide-react';

const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  id: 'usr_123456789',
  createdAt: 'January 15, 2025',
  lastLogin: 'Today at 2:30 PM',
};

const mockSessions = [
  { id: '1', device: 'Chrome on Windows', location: 'Nairobi, Kenya', ip: '102.68.xxx.xxx', lastActive: 'Active now', current: true, icon: Monitor },
  { id: '2', device: 'Safari on iPhone', location: 'Lagos, Nigeria', ip: '105.112.xxx.xxx', lastActive: '2 hours ago', current: false, icon: Smartphone },
  { id: '3', device: 'Firefox on macOS', location: 'Accra, Ghana', ip: '154.160.xxx.xxx', lastActive: '1 day ago', current: false, icon: Globe },
];


export default function DashboardPage() {
  const router = useRouter(); 
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  
  const user = mockUser;
  const sessions = mockSessions;

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      return setPasswordError('New passwords do not match');
    }
    if (newPassword.length < 8) {
      return setPasswordError('Password must be at least 8 characters long');
    }

   
    console.log('Changing password...');
    setTimeout(() => {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('iaa_authenticated');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
   
    window.dispatchEvent(new Event('iaa-auth-change'));
    
   
    router.push('/auth/login');
  };

  const handleTerminateSession = (sessionId: string) => {
    console.log('Terminating session:', sessionId);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and security preferences
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User /> Profile Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-medium">{user.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email Address</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs">{user.id}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">{user.createdAt}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock /> Change Password</CardTitle>
                <CardDescription>Update your password for enhanced security</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}
                  {passwordSuccess && (
                    <Alert className="border-green-500 bg-green-500/10 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>Password changed successfully!</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <Input id="confirm-new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
                  </div>
                  <Button type="submit" className="w-full">Update Password</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield /> Active Sessions</CardTitle>
              <CardDescription>Manage devices where you are currently logged in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.map((session) => {
                const Icon = session.icon;
                return (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{session.device}</p>
                          {session.current && <Badge variant="secondary">Current Session</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{session.location} • {session.ip}</p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button onClick={() => handleTerminateSession(session.id)} variant="outline" size="sm">
                        Terminate
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}