// Every shadcn/ui module must import cleanly. Catches a missing or wrongly
// hoisted dependency (Radix, cmdk, vaul, recharts, ...) in seconds instead of
// at the first render in a project.
const modules = import.meta.glob("../../src/components/ui/*.tsx");

describe("ui modules", () => {
  it("has modules to check", () => {
    expect(Object.keys(modules).length).toBeGreaterThan(30);
  });

  for (const [path, load] of Object.entries(modules)) {
    it(`loads ${path.split("/").pop()}`, async () => {
      const mod = (await load()) as Record<string, unknown>;
      expect(Object.keys(mod).length).toBeGreaterThan(0);
    });
  }
});
