import { describe, expect, it } from "vitest";
import { GET as companyManifestGet } from "@/app/company/manifest.webmanifest/route";
import { GET as employeeManifestGet } from "@/app/employee/manifest.webmanifest/route";
import { isPwaInstallAsset, PWA_INSTALL_PATHS } from "@/lib/pwa/assets";
import { companyManifest, employeeManifest } from "@/lib/pwa/manifest";

describe("manifestes ERP", () => {
  it("déclare un scope de dossier distinct pour chaque espace", () => {
    const company = companyManifest("erp");
    const employee = employeeManifest("erp");

    expect(company.scope).toBe("/company/");
    expect(company.start_url).toBe("/company");
    expect(company.id).toBe("/company/");
    expect(company.name).toBe("ERP RH — Entreprise");
    expect(company.display).toBe("standalone");

    expect(employee.scope).toBe("/employee/");
    expect(employee.start_url).toBe("/employee");
    expect(employee.id).toBe("/employee/");
    expect(employee.name).toBe("ERP RH — Employé");

    expect(`${company.start_url}/`).toBe(company.scope);
    expect(`${employee.start_url}/`).toBe(employee.scope);
  });

  it("n'annonce que les raccourcis dont la page existe et dont le module erp est actif", () => {
    expect(companyManifest("erp").shortcuts.map((item) => item.url)).toEqual([
      "/company/employes",
      "/company/conges",
    ]);
    expect(employeeManifest("erp").shortcuts.map((item) => item.url)).toEqual([
      "/employee/conges",
      "/employee/pointage",
      "/employee/documents",
    ]);
    expect(companyManifest("recrutement").shortcuts).toEqual([]);
    expect(employeeManifest("").shortcuts.length).toBeGreaterThan(0);
  });

  it("répond 200 sans session sur les deux manifestes", async () => {
    const company = await companyManifestGet();
    const employee = await employeeManifestGet();
    expect(company.status).toBe(200);
    expect(employee.status).toBe(200);
    expect(company.headers.get("content-type")).toContain("application/manifest+json");
    const companyBody = await company.json();
    const employeeBody = await employee.json();
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
    expect(isPwaInstallAsset("/company/employes")).toBe(false);
  });
});
