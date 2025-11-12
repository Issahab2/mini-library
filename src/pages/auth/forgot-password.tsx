import { CTAButton, SecondaryButton } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Library, ArrowLeft, Mail } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to send reset email");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success("If an account exists, a password reset link has been sent.");

      // In development, show the reset URL if provided
      if (result.resetUrl && process.env.NODE_ENV === "development") {
        console.log("Reset URL:", result.resetUrl);
        toast.info(`Development: Reset URL is ${result.resetUrl}`);
      }
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
                <Mail className="size-12 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
              <CardDescription>
                If an account with that email exists, we&apos;ve sent a password reset link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Please check your email inbox and follow the instructions to reset your password. The link will expire
                in 1 hour.
              </p>
              <div className="pt-4">
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
            <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
            <CardDescription>Enter your email address and we&apos;ll send you a reset link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(handleForgotPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
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
