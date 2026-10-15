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

  test("les pages publiques FAQ, offres et CGU répondent", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("#contenu-principal")).toBeVisible();
    await page.goto("/offres");
    await expect(page.locator("#contenu-principal")).toBeVisible();
    await page.goto("/cgu");
    await expect(page.locator("#contenu-principal")).toBeVisible();
  });

  test("l'inscription candidat et entreprise affiche une progression", async ({ page }) => {
    await page.goto("/register/candidate");
    await expect(page.getByRole("progressbar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuer" })).toBeVisible();
    await page.goto("/register/company");
    await expect(page.getByRole("progressbar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuer" })).toBeVisible();
  });
});
