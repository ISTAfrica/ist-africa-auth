"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { jwtDecode } from 'jwt-decode';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Edit, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { getProfile, updateProfile, uploadAvatar } from "@/services/authService";

interface DecodedToken {
  sub: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

type UserProfile = {
  id: number;
  name: string | null;
  email: string;
  createdAt: string;
  profilePicture?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  const [editedName, setEditedName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editError, setEditError] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editDialogCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const processAuth = () => {
      // Check if this is a LinkedIn redirect with auth params
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      
      if (accessToken && refreshToken) {
        console.log('🟡 Processing LinkedIn authentication...');
        
        try {
          // Store tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          // Decode and store user ID
          const decodedToken = jwtDecode<DecodedToken>(accessToken);
          localStorage.setItem('userId', decodedToken.sub);

          // Store additional user data from URL params
          const userId = searchParams.get('userId');
          const name = searchParams.get('name');
          const email = searchParams.get('email');
          const role = searchParams.get('role');
          const membershipStatus = searchParams.get('membershipStatus');
          const isVerified = searchParams.get('isVerified');
          const profilePicture = searchParams.get('profilePicture');

          if (userId) localStorage.setItem('userId', userId);
          if (name) localStorage.setItem('userName', name);
          if (email) localStorage.setItem('userEmail', email);
          if (role) localStorage.setItem('userRole', role);
          if (membershipStatus) localStorage.setItem('membershipStatus', membershipStatus);
          if (profilePicture) {
            localStorage.setItem('profilePicture', profilePicture);
            setProfilePictureUrl(profilePicture);
            console.log('🟡 ✓ Profile picture stored:', profilePicture);
          }
          if (isVerified) localStorage.setItem('isVerified', isVerified);

          console.log('🟡 ✓ Authentication complete, cleaning URL...');
          
          // Clean the URL by removing query params
          router.replace('/user/profile');
          
        } catch (err) {
          console.error('🟡 ❌ Token decode error:', err);
          router.replace('/auth/login?error=Invalid token');
        }
      }
    };

    processAuth();
  }, [searchParams, router]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Check localStorage for profile picture first
        const storedPicture = localStorage.getItem('profilePicture');
        if (storedPicture) {
          console.log('✓ Profile picture loaded from localStorage:', storedPicture);
          setProfilePictureUrl(storedPicture);
        }

        const profileData = await getProfile();
        setUser(profileData);
        setEditedName(profileData.name || "");
        
        // Use API profile picture if available and localStorage doesn't have one
        if (!storedPicture && profileData.profilePicture) {
          setProfilePictureUrl(profileData.profilePicture);
        }
      } catch (error) {
        console.error("Failed to fetch profile, redirecting...", error);
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setIsUpdatingProfile(true);
    try {
      const updatedUser = await updateProfile({ name: editedName });
      setUser(updatedUser);
      editDialogCloseRef.current?.click();
    } catch (err: any) {
      setEditError(err.message || "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setAvatarError("");

    try {
      const updatedUser = await uploadAvatar(file);
      setUser(updatedUser);
      // Update the profile picture URL if returned from API
      if (updatedUser.profilePicture) {
        setProfilePictureUrl(updatedUser.profilePicture);
        localStorage.setItem('profilePicture', updatedUser.profilePicture);
      }
    } catch (err: any) {
      setAvatarError(err.message || "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Use profilePictureUrl (from localStorage or API) or fall back to user.profilePicture
  const displayPictureUrl = profilePictureUrl || user.profilePicture;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Edit /> Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={displayPictureUrl} alt={user.name || "User"} />
              <AvatarFallback>{user.name?.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
            </Avatar>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit className="h-4 w-4 mr-2" />}
              {isUploading ? "Uploading..." : "Change Photo"}
            </Button>
            {avatarError && <p className="text-sm text-destructive">{avatarError}</p>}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs">Full Name</Label>
              <p className="text-foreground font-medium">{user.name}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground text-xs">Member Since</Label>
              <p className="text-foreground font-medium">{format(new Date(user.createdAt), "MMMM d, yyyy")}</p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default"><Edit className="h-4 w-4 mr-2" /> Edit Profile</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>Update your personal information</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleProfileUpdate} className="space-y-4 py-4">
                  {editError && <Alert variant="destructive"><AlertDescription>{editError}</AlertDescription></Alert>}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={editedName} onChange={e => setEditedName(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isUpdatingProfile}>{isUpdatingProfile ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button>
                  </DialogFooter>
                </form>
                <DialogClose ref={editDialogCloseRef} className="hidden" />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}