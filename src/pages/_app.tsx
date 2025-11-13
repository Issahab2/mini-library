import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/next";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import { Montserrat } from "next/font/google";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});
function RouterLoadingBar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);
    const handleError = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleError);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleError);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-background overflow-hidden">
      <div
        className="h-full w-1/3 bg-primary"
        style={{
          animation: "loading 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <div className={`${montserrat.className}`}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <SessionProvider session={pageProps.session} refetchInterval={5 * 60} refetchOnWindowFocus={true}>
          <QueryClientProvider client={queryClient}>
            <Component {...pageProps} />
            <Toaster />
            <RouterLoadingBar />
            <Analytics />
          </QueryClientProvider>
        </SessionProvider>
      </ThemeProvider>
    </div>
  );
}
