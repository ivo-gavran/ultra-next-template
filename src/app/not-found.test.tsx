import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NotFound from "@/app/not-found";

vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve("bs"),
  getTranslations: () =>
    Promise.resolve((key: string) => {
      const messages: Record<string, string> = {
        backHome: "Nazad na početnu",
        notFoundDescription:
          "Stranica koju tražite ne postoji ili je premještena.",
        notFoundTitle: "Stranica nije pronađena",
      };

      return messages[key];
    }),
}));

describe("NotFound", () => {
  it("uses the request locale", async () => {
    render(await NotFound());

    expect(
      screen.getByRole("link", { name: "Nazad na početnu" }),
    ).toHaveAttribute("href", "/bs");
    expect(screen.getByText("Stranica nije pronađena")).toBeInTheDocument();
  });
});
