import { describe, expect, it } from "vitest";
import { DEFAULT_CHANNELS, NOTIFICATION_EVENTS } from "@/lib/notifications/events";
import { toE164, toInternationalDigits } from "@/lib/notifications/phone";
import { renderInAppMessage, renderNotificationText } from "@/lib/notifications/templates/text";
import { notificationErrorMessage } from "@/lib/notifications/log";

describe("notification channels §5.3", () => {
  it("covers every event with the CDC default channels", () => {
    expect(NOTIFICATION_EVENTS).toEqual([
      "ACCOUNT_CREATED",
      "NEW_APPLICATION",
      "INTERVIEW_INVITE",
      "LEAVE_DECISION",
      "COURSE_AVAILABLE",
      "PAYMENT_CONFIRMED",
    ]);
    expect(DEFAULT_CHANNELS.ACCOUNT_CREATED).toEqual(["email"]);
    expect(DEFAULT_CHANNELS.NEW_APPLICATION).toEqual(["email", "in-app"]);
    expect(DEFAULT_CHANNELS.INTERVIEW_INVITE).toEqual(["email", "sms", "whatsapp"]);
    expect(DEFAULT_CHANNELS.LEAVE_DECISION).toEqual(["email", "in-app"]);
    expect(DEFAULT_CHANNELS.COURSE_AVAILABLE).toEqual(["email"]);
    expect(DEFAULT_CHANNELS.PAYMENT_CONFIRMED).toEqual(["email", "sms"]);
  });
});

describe("phone formatting", () => {
  it("normalizes Cameroon numbers for Twilio and WhatsApp", () => {
    expect(toInternationalDigits("6 77 12 34 56")).toBe("237677123456");
    expect(toE164("+237 677 12 34 56")).toBe("+237677123456");
    expect(toInternationalDigits("00237677123456")).toBe("237677123456");
  });
});

describe("templates", () => {
  it("renders in-app and text bodies for each event", () => {
    expect(renderInAppMessage("NEW_APPLICATION", {
      jobTitle: "Comptable junior",
      candidateName: "Ada Lovelace",
      companyName: "Acme",
    })).toContain("Ada Lovelace");
    expect(
      renderNotificationText("PAYMENT_CONFIRMED", {
        firstName: "Ada",
        amountLabel: "10 000 FCFA",
        reference: "MOMO-1",
        invoiceNumber: "FAC-2026-1",
      }),
    ).toContain("MOMO-1");
  });
});

describe("error sanitization", () => {
  it("strips secrets from logged messages", () => {
    expect(
      notificationErrorMessage(new Error("Twilio token=secret123 Authorization: Bearer abc")),
    ).not.toMatch(/secret123|Bearer abc/);
  });
});
