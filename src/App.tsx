import { lazy, Suspense } from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster, toast } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageLoader from "@/components/PageLoader";
import Index from "@/pages/Index";

const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // One place for "data failed to load". Queries that handle their own
    // error state can set meta: { silent: true }.
    onError: (error, query) => {
      if (query.meta?.silent) return;
      console.error("Query failed:", query.queryKey, error);
      toast.error("Data could not be loaded", {
        description: "Check your connection and reload the page.",
      });
    },
  }),
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<PageLoader label="Page" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  );
}
