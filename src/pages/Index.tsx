import { usePageMeta } from "@/hooks/usePageMeta";

const Index = () => {
  // TODO: replace with the project's own title and description.
  usePageMeta({
    title: "Project Name",
    description: "Short description of the project (max 160 characters)",
  });

  return (
    <main className="min-h-screen bg-background">
      {/* Exactly one <h1> per page. Replace this placeholder with the real headline. */}
      <h1 className="sr-only">Project Name</h1>
      {/* Your app starts here */}
    </main>
  );
};

export default Index;
