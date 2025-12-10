"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, Linkedin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerUser } from "@/services/authService";

export default function SignUpForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await registerUser({ name, email, password });
      setSuccess("Account created successfully! Redirecting to verify...");
      try {
        localStorage.setItem("pendingEmail", email);
      } catch {}
      const redirectUrl = result?.redirectUrl || "/auth/verify-email";
      router.push(
        `${redirectUrl}${
          redirectUrl.includes("?") ? "&" : "?"
        }email=${encodeURIComponent(email)}`
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setLoading(false);
    }
  };

  const handleLinkedInSignUp = () => {
    setLinkedinLoading(true);
    setError("");
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    window.location.href = `${baseUrl}/api/auth/linkedin`;
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Create an Account
        </h2>
        <p className="text-muted-foreground">
          Get started with your IAA account
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-500 bg-green-500/10 text-green-700">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full font-semibold"
          disabled={loading || linkedinLoading || !!success}
        >
          {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleLinkedInSignUp}
          variant="outline"
          className="w-full font-semibold bg-linkedin text-white hover:bg-linkedin/90 border-linkedin"
          disabled={loading || linkedinLoading || !!success}
        >
          {linkedinLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Linkedin className="mr-2 h-4 w-4" />
          )}
          Continue with LinkedIn
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-4">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Sign In
          </Link>
        </p>
      </form>
    </>
  );
}