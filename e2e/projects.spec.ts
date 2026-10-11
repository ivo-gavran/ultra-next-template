import { expect, test } from "@playwright/test";

test("completes the project lifecycle through the API contract", async ({
  page,
}) => {
  const projectName = "Launch website";
  const updatedProjectName = "Launch customer website";

  await page.goto("/en/projects");
  await expect(
    page.getByRole("cell", { name: "Connect the real API", exact: true }),
  ).toBeVisible();

  await page.getByLabel("Project name").fill(projectName);
  await page
    .getByLabel("Description")
    .fill("A project created through the typed external API contract.");
  await page.getByRole("button", { name: "Add project" }).click();

  await expect(
    page.getByRole("cell", { name: projectName, exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: `Open actions for ${projectName}` })
    .click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  const dialog = page.getByRole("dialog", { name: "Edit project" });
  await dialog.getByLabel("Project name").fill(updatedProjectName);
  await dialog.getByRole("button", { name: "Save changes" }).click();

  await expect(
    page.getByRole("cell", { name: updatedProjectName, exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: `Open actions for ${updatedProjectName}` })
    .click();
  await page.getByRole("menuitem", { name: "Delete" }).click();

  const confirmation = page.getByRole("alertdialog", {
    name: "Delete project?",
  });
  await expect(confirmation).toContainText(updatedProjectName);
  await confirmation.getByRole("button", { name: "Delete project" }).click();

  await expect(
    page.getByRole("cell", { name: updatedProjectName, exact: true }),
  ).toHaveCount(0);
});

test("keeps project discovery state in the URL", async ({ page }) => {
  await page.goto("/en/projects?ref=docs");

  await page.getByLabel("Search projects").fill("observability");
  await expect(page).toHaveURL(/search=observability/);
  await expect(
    page.getByRole("cell", { name: "Configure observability", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("1 project", { exact: true })).toBeVisible();

  await page.getByLabel("Search projects").clear();
  await expect(page).not.toHaveURL(/search=/);

  const nameHeader = page.getByRole("columnheader", { name: "Name" });
  // The name cell also holds a mobile-only description, so compare the
  // accessible name, which skips content hidden at this viewport.
  const firstRowName = page.locator("tbody tr").first().locator("td").first();

  await nameHeader.getByRole("button", { name: "Name" }).click();
  await expect(page).toHaveURL(/sort=name-asc/);
  await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
  await expect(firstRowName).toHaveAccessibleName("Configure observability");

  await nameHeader.getByRole("button", { name: "Name" }).click();
  await expect(page).toHaveURL(/sort=name-desc/);
  await expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  await expect(firstRowName).toHaveAccessibleName("Review accessibility");

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole("cell", { name: "Configure observability", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/ref=docs/);

  await page.reload();
  await expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  await expect(
    page.getByRole("cell", { name: "Configure observability", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/page=2/);
  await expect(page).toHaveURL(/ref=docs/);
});

test("resets pagination when search or sort changes", async ({ page }) => {
  await page.goto("/en/projects?page=2&ref=docs");
  await expect(
    page.getByRole("button", { name: "Previous", exact: true }),
  ).toBeEnabled();

  await page
    .getByRole("columnheader", { name: "Name" })
    .getByRole("button", { name: "Name" })
    .click();
  await expect(page).toHaveURL(/sort=name-asc/);
  await expect(page).not.toHaveURL(/[?&]page=/);

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.getByLabel("Search projects").fill("observability");
  await expect(page).toHaveURL(/search=observability/);
  await expect(page).not.toHaveURL(/[?&]page=/);
  await expect(page).toHaveURL(/sort=name-asc/);
  await expect(page).toHaveURL(/ref=docs/);
  await expect(
    page.getByRole("cell", { name: "Configure observability", exact: true }),
  ).toBeVisible();
});

test("keeps valid URL filters when another parameter is invalid", async ({
  page,
}) => {
  await page.goto(
    "/en/projects?search=observability&sort=name-desc&page=-1&pageSize=51",
  );
  await expect(page.getByLabel("Search projects")).toHaveValue("observability");
  await expect(
    page.getByRole("columnheader", { name: "Name" }),
  ).toHaveAttribute("aria-sort", "descending");
  await expect(
    page.getByRole("cell", { name: "Configure observability", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("1 project", { exact: true })).toBeVisible();
});

test("summarizes the project collection above the table", async ({ page }) => {
  await page.goto("/en/projects");

  const overview = page.getByRole("region", { name: "Overview" });
  const totalCard = overview
    .locator('[data-slot="card"]')
    .filter({ hasText: "Total projects" });
  const documentedCard = overview
    .locator('[data-slot="card"]')
    .filter({ hasText: "With a description" });

  await expect(totalCard).toContainText("4");
  await expect(documentedCard).toContainText("100% of all projects");

  await page.getByLabel("Project name").fill("Summary refresh");
  await page.getByRole("button", { name: "Add project" }).click();

  await expect(totalCard).toContainText("5");
});
