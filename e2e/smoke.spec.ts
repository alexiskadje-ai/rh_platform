import { expect, test } from "@playwright/test";

test.describe("smoke public", () => {
  test("la page d'accueil répond et expose la navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#contenu-principal")).toBeVisible();
    await expect(page.getByRole("link", { name: "PES-RH" }).first()).toBeVisible();
  });

  test("la page de connexion est accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
    await expect(page.getByLabel("E-mail ou téléphone")).toBeVisible();
  });
});
