import { CTAButton, SecondaryButton } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Library, ArrowLeft, Lock } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = useMemo(() => {
    if (!router.isReady) return null;
    const queryToken = router.query.token;
    return queryToken && typeof queryToken === "string" ? queryToken : null;
  }, [router.isReady, router.query.token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to reset password");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success("Password has been reset successfully!");

      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        router.push("/auth/signin");
      }, 2000);
    } catch {
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <PublicLayout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <Lock className="size-12 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Password Reset Successful</CardTitle>
              <CardDescription>Your password has been reset successfully</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                You can now sign in with your new password. Redirecting to sign in page...
              </p>
              <div className="pt-4">
                <Link href="/auth/signin">
                  <CTAButton className="w-full">Go to Sign In</CTAButton>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (!token) {
    return (
      <PublicLayout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <Library className="size-12 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
              <CardDescription>This password reset link is invalid or has expired</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">Please request a new password reset link.</p>
              <div className="pt-4 space-y-2">
                <Link href="/auth/forgot-password">
                  <CTAButton className="w-full">Request New Reset Link</CTAButton>
                </Link>
                <Link href="/auth/signin">
                  <SecondaryButton className="w-full">
                    <ArrowLeft className="mr-2 size-4" />
                    Back to Sign In
                  </SecondaryButton>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Library className="size-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Enter your new password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
              <CTAButton type="submit" disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <svg
                      className="mr-2 size-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </CTAButton>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link href="/auth/signin">
              <SecondaryButton variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 size-4" />
                Back to Sign In
              </SecondaryButton>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}
