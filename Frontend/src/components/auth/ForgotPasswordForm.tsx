"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function forgotPasswordDirect(email: string) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();
  return result; 
}

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!email) {
      setMessage("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPasswordDirect(email);
      setMessage(result.message);
      setSuccess(result.success);
      if (result.success) setEmail("");
    } catch (err) {
      console.error("API Error:", err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Forgot Password?
        </h2>
        <p className="text-muted-foreground">
          Enter your email and we will send you a reset link
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-3 mb-4 rounded ${
            success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{message}</span>
        </div>
      )}

      {!success ? (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>

          <Button
            type="button"
            onClick={() => router.push("/auth/login")}
            variant="ghost"
            className="w-full"
            disabled={loading}
          >
            Back to Login
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-4">
            Secured by IST Africa Auth
          </p>
        </form>
      ) : (
        <Button
          onClick={() => router.push("/auth/login")}
          variant="outline"
          className="w-full"
        >
          Back to Login
        </Button>
      )}
    </>
  );
}
