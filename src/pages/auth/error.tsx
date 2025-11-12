import * as React from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CTAButton } from "@/components/ui/button-variants";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function AuthErrorPage() {
  const router = useRouter();
  const { error } = router.query;

  const getErrorMessage = (errorType: string | string[] | undefined) => {
    if (typeof errorType !== "string") return "An authentication error occurred";

    switch (errorType) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "Default":
      default:
        return "An error occurred during authentication. Please try again.";
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="size-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription>{getErrorMessage(error)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              If this problem persists, please contact support.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <CTAButton onClick={() => router.push("/auth/signin")} className="w-full">
            Try Again
          </CTAButton>
          <Link href="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 size-4" />
              Back to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
    </PublicLayout>
  );
}
