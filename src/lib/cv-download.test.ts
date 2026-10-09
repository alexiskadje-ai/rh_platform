import { describe, expect, it } from "vitest";
import { GOLD_CV_DOWNLOAD_QUOTA } from "@/lib/config/recruiter-packs";
import {
  canMeterGoldDownload,
  downloadsNeeded,
  goldQuotaRemaining,
} from "@/lib/cv-download";

describe("cv download quota", () => {
  it("counts unique candidate ids", () => {
    expect(downloadsNeeded(["a", "a", "b"])).toBe(2);
    expect(downloadsNeeded([])).toBe(0);
  });

  it("tracks Gold remaining against the pack quota", () => {
    expect(goldQuotaRemaining(0)).toBe(GOLD_CV_DOWNLOAD_QUOTA);
    expect(goldQuotaRemaining(GOLD_CV_DOWNLOAD_QUOTA)).toBe(0);
    expect(goldQuotaRemaining(GOLD_CV_DOWNLOAD_QUOTA + 5)).toBe(0);
  });

  it("meters only the Gold tier", () => {
    expect(canMeterGoldDownload("STANDARD", 999)).toBe(true);
    expect(canMeterGoldDownload("PREMIUM", 999)).toBe(true);
    expect(canMeterGoldDownload("GOLD", 0)).toBe(true);
    expect(canMeterGoldDownload("GOLD", GOLD_CV_DOWNLOAD_QUOTA)).toBe(false);
  });
});
