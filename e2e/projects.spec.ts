import { expect, test } from "@playwright/test";

test("completes the project lifecycle through the API contract", async ({
  page,
}) => {
  const projectName = "Launch website";

  await page.goto("/en/projects");
  await expect(
    page.getByRole("heading", { level: 3, name: "Connect the real API" }),
  ).toBeVisible();

  await page.getByLabel("Project name").fill(projectName);
  await page
    .getByLabel("Description")
    .fill("A project created through the typed external API contract.");
  await page.getByRole("button", { name: "Add project" }).click();

  await expect(
    page.getByRole("heading", { level: 3, name: projectName }),
  ).toBeVisible();

  await page.getByRole("button", { name: `Edit ${projectName}` }).click();
  const dialog = page.getByRole("dialog", { name: "Edit project" });
  await dialog.getByLabel("Project name").fill("Launch customer website");
  await dialog.getByRole("button", { name: "Save changes" }).click();

  const updatedProjectName = "Launch customer website";
  await expect(
    page.getByRole("heading", { level: 3, name: updatedProjectName }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: `Delete ${updatedProjectName}` })
    .click();
  const confirmation = page.getByRole("alertdialog", {
    name: "Delete project?",
  });
  await expect(confirmation).toContainText(updatedProjectName);
  await confirmation.getByRole("button", { name: "Delete project" }).click();
  await expect(
    page.getByRole("heading", { level: 3, name: updatedProjectName }),
  ).not.toBeVisible();
});

test("keeps project discovery state in the URL", async ({ page }) => {
  await page.goto("/en/projects");

  await page.getByLabel("Search projects").fill("observability");
  await expect(page).toHaveURL(/search=observability/);
  await expect(
    page.getByRole("heading", { level: 3, name: "Configure observability" }),
  ).toBeVisible();
  await expect(page.getByText("1 project", { exact: true })).toBeVisible();

  await page.getByLabel("Search projects").clear();
  await expect(page).not.toHaveURL(/search=/);

  await page.getByRole("combobox", { name: "Sort projects" }).click();
  await page.getByRole("option", { name: "Name Z–A" }).click();
  await expect(page).toHaveURL(/sort=name-desc/);
  await expect(page.getByRole("heading", { level: 3 }).first()).toHaveText(
    "Review accessibility",
  );

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole("heading", { level: 3, name: "Configure observability" }),
  ).toBeVisible();
});
