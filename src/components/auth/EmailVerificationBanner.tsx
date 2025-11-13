import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // Don't show banner if not authenticated or email is verified
  if (!isAuthenticated || !user || user.emailVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification email");
      }

      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Verify Your Email Address</h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              Please verify your email address to access all features. Check your inbox for a verification link.
            </p>
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              size="sm"
              variant="outline"
              className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
            >
              {isResending ? (
                <>
                  <Mail className="mr-2 h-4 w-4 animate-pulse" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
