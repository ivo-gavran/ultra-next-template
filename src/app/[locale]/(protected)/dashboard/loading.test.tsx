import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import bsMessages from "../../../../../messages/bs.json";
import enMessages from "../../../../../messages/en.json";

import DashboardLoading from "@/app/[locale]/(protected)/dashboard/loading";

describe("DashboardLoading", () => {
  it("announces the localized loading state", () => {
    render(
      <NextIntlClientProvider
        locale="bs"
        messages={bsMessages as unknown as typeof enMessages}
      >
        <DashboardLoading />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Učitavanje stranice…",
    );
  });
});
