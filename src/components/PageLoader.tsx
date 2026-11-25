import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  /** Names what is loading, e.g. "Page", "Your orders". */
  label: string;
};

/**
 * Suspense/loading fallback that announces what loads and sketches the
 * layout instead of a bare spinner.
 */
export default function PageLoader({ label }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen bg-background px-6 py-12"
    >
      <p className="sr-only">Loading {label}</p>
      <div className="mx-auto max-w-3xl space-y-6" aria-hidden="true">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
