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

  await page.getByRole("button", { name: `Delete ${projectName}` }).click();
  await expect(
    page.getByRole("heading", { level: 3, name: projectName }),
  ).not.toBeVisible();
});
