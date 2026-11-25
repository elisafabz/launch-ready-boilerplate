import { Link, useLocation } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";

const NotFound = () => {
  const { pathname } = useLocation();
  usePageMeta({ title: "Page not found", noindex: true });

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-muted-foreground mb-2">Error 404</p>
        <h1 className="text-3xl font-bold mb-3 text-foreground">This page does not exist</h1>
        <p className="text-muted-foreground mb-6">
          There is nothing at <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{pathname}</code>.
          The link is outdated or contains a typo.
        </p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go to home page
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
