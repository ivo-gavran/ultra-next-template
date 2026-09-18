import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import bsMessages from "../../../../messages/bs.json";
import enMessages from "../../../../messages/en.json";

import ProjectsLoading from "@/app/[locale]/projects/loading";

describe("ProjectsLoading", () => {
  it("announces the localized loading state", () => {
    render(
      <NextIntlClientProvider
        locale="bs"
        messages={bsMessages as unknown as typeof enMessages}
      >
        <ProjectsLoading />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Učitavanje stranice…",
    );
  });
});
