"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Edit, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import {
  getProfile,
  updateProfile,
  uploadAvatar,
} from "@/services/authService";
import LinkedInPopupHandler from "@/components/LinkedInPopupHandler";

/* ===================== TYPES ===================== */
type UserProfile = {
  id: number;
  name: string | null;
  email: string;
  createdAt: string;
  profilePicture?: string | null;
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

  const accessTokenParam = searchParams.get("accessToken");
  const errorParam = searchParams.get("error");

  /* ===================== FETCH PROFILE ===================== */
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const storedPicture = localStorage.getItem("profilePicture");
        if (storedPicture) {
          setProfilePictureUrl(storedPicture);
        }

        // 🔥 FIX: Explicitly type the response
        const profileData = (await getProfile()) as UserProfile;

        setUser(profileData);
        setEditedName(profileData.name ?? "");

        if (!storedPicture && profileData.profilePicture) {
          setProfilePictureUrl(profileData.profilePicture);
          localStorage.setItem("profilePicture", profileData.profilePicture);
        }
      } catch (error) {
        console.error(error);
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  /* ===================== HANDLERS ===================== */
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setIsUpdatingProfile(true);

    try {
      const updatedUser = (await updateProfile({
        name: editedName,
      })) as UserProfile;

      setUser(updatedUser);
      editDialogCloseRef.current?.click();
    } catch {
      setEditError("Failed to update profile.");
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
      const updatedUser = (await uploadAvatar(file)) as UserProfile;
      setUser(updatedUser);

      if (updatedUser.profilePicture) {
        setProfilePictureUrl(updatedUser.profilePicture);
        localStorage.setItem("profilePicture", updatedUser.profilePicture);
      }
    } catch {
      setAvatarError("Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ===================== LINKEDIN HANDLER ===================== */
  if (accessTokenParam || errorParam) {
    return <LinkedInPopupHandler />;
  }

  /* ===================== LOADING ===================== */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const displayPictureUrl = profilePictureUrl ?? user.profilePicture ?? "";

  /* ===================== UI ===================== */
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit /> Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={displayPictureUrl} alt={user.name ?? "User"} />
              <AvatarFallback>
                {user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
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
              {isUploading ? "Uploading..." : "Change Photo"}
            </Button>

            {avatarError && (
              <p className="text-sm text-destructive">{avatarError}</p>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs">Full Name</Label>
              <p className="font-medium">{user.name}</p>
            </div>

            <Separator />

            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="font-medium">{user.email}</p>
            </div>

            <Separator />

            <div>
              <Label className="text-muted-foreground text-xs">
                Member Since
              </Label>
              <p className="font-medium">
                {format(new Date(user.createdAt), "MMMM d, yyyy")}
              </p>
            </div>

            {/* Edit Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your personal information
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={handleProfileUpdate}
                  className="space-y-4 py-4"
                >
                  {editError && (
                    <Alert variant="destructive">
                      <AlertDescription>{editError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>

                    <Button type="submit" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
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
