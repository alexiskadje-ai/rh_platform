import { describe, expect, it } from "vitest";
import { GET as siteManifestGet } from "@/app/manifest.webmanifest/route";
import { GET as companyManifestGet } from "@/app/company/manifest.webmanifest/route";
import { GET as employeeManifestGet } from "@/app/employee/manifest.webmanifest/route";
import { isPwaInstallAsset, PWA_INSTALL_PATHS } from "@/lib/pwa/assets";
import { companyManifest, employeeManifest, siteManifest } from "@/lib/pwa/manifest";

describe("manifestes PWA", () => {
  it("déclare le manifeste public pour l'icône d'accueil", () => {
    const site = siteManifest();
    expect(site.scope).toBe("/");
    expect(site.start_url).toBe("/");
    expect(site.id).toBe("/");
    expect(site.name).toBe("PES-RH");
    expect(site.display).toBe("standalone");
    expect(site.icons.map((icon) => icon.src)).toEqual([
      "/pwa/site/icon-192.png",
      "/pwa/site/icon-512.png",
      "/pwa/site/icon-512-maskable.png",
    ]);
  });

  it("déclare un scope de dossier distinct pour chaque espace", () => {
    const company = companyManifest();
    const employee = employeeManifest();

    expect(company.scope).toBe("/company/");
    expect(company.start_url).toBe("/company");
    expect(company.id).toBe("/company/");
    expect(company.name).toBe("PES-RH — Recrutement");
    expect(company.display).toBe("standalone");

    expect(employee.scope).toBe("/employee/");
    expect(employee.start_url).toBe("/employee");
    expect(employee.id).toBe("/employee/");
    expect(employee.name).toBe("PES-RH — Employé");

    expect(`${company.start_url}/`).toBe(company.scope);
    expect(`${employee.start_url}/`).toBe(employee.scope);
  });

  it("annonce des raccourcis vers des pages existantes", () => {
    expect(companyManifest().shortcuts.map((item) => item.url)).toEqual([
      "/company/offres",
      "/company/candidats",
    ]);
    expect(employeeManifest().shortcuts.map((item) => item.url)).toEqual([
      "/employee/conges",
      "/employee/pointage",
      "/employee/documents",
    ]);
  });

  it("répond 200 sans session sur les manifestes", async () => {
    const site = await siteManifestGet();
    const company = await companyManifestGet();
    const employee = await employeeManifestGet();
    expect(site.status).toBe(200);
    expect(company.status).toBe(200);
    expect(employee.status).toBe(200);
    expect(site.headers.get("content-type")).toContain("application/manifest+json");
    const siteBody = await site.json();
    const companyBody = await company.json();
    const employeeBody = await employee.json();
    expect(siteBody.scope).toBe("/");
    expect(companyBody.scope).toBe("/company/");
    expect(employeeBody.scope).toBe("/employee/");
  });
});

describe("proxy et installation", () => {
  it("laisse passer un visiteur non connecté sur les manifestes, le worker, hors ligne et les icônes", () => {
    for (const path of PWA_INSTALL_PATHS) {
      expect(isPwaInstallAsset(path)).toBe(true);
    }
    expect(isPwaInstallAsset("/company")).toBe(false);
    expect(isPwaInstallAsset("/employee")).toBe(false);
    expect(isPwaInstallAsset("/company/offres")).toBe(false);
  });
});
