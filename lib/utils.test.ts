import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles tailwind merge - later class overrides conflicting", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("handles undefined and false", () => {
    expect(cn("foo", undefined, false, "bar")).toBe("foo bar");
  });
});
