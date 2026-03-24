import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  formatDate,
  formatTime,
  groupByDay,
  getApiError,
  STATUS_STYLE,
  TYPE_STYLE,
} from "../Helper/helper";
import type { Slot } from "../Types/SlotType";

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe("formatDate", () => {
  it("formats date in Polish locale", () => {
    const result = formatDate("2025-06-15T10:00:00", "pl");
    expect(result).toContain("2025");
    expect(result).toContain("15");
  });

  it("formats date in English locale", () => {
    const result = formatDate("2025-06-15T10:00:00", "en");
    expect(result).toContain("2025");
    expect(result).toContain("15");
  });
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------

describe("formatTime", () => {
  it("returns HH:MM string", () => {
    const result = formatTime("2025-06-15T08:30:00");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// groupByDay
// ---------------------------------------------------------------------------

describe("groupByDay", () => {
  const makeSlot = (start_dt: string): Slot =>
    ({
      id: Math.random(),
      start_dt,
      end_dt: start_dt,
      slot_type: "INBOUND",
      original_slot_type: "INBOUND",
      status: "AVAILABLE",
    } as unknown as Slot);

  it("groups slots by date prefix", () => {
    const slots = [
      makeSlot("2025-06-01T08:00:00"),
      makeSlot("2025-06-01T10:00:00"),
      makeSlot("2025-06-02T09:00:00"),
    ];
    const result = groupByDay(slots);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result["2025-06-01"]).toHaveLength(2);
    expect(result["2025-06-02"]).toHaveLength(1);
  });

  it("returns empty object for no slots", () => {
    expect(groupByDay([])).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// getApiError
// ---------------------------------------------------------------------------

describe("getApiError", () => {
  it("returns UNKNOWN_ERROR for non-axios errors", () => {
    expect(getApiError(new Error("oops"))).toBe("UNKNOWN_ERROR");
    expect(getApiError("string error")).toBe("UNKNOWN_ERROR");
    expect(getApiError(null)).toBe("UNKNOWN_ERROR");
  });

  it("extracts error_code from axios response", () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { detail: { error_code: "ALIAS_TAKEN" } },
      },
      message: "Request failed",
    };
    expect(getApiError(axiosError)).toBe("ALIAS_TAKEN");
  });

  it("extracts string detail from axios response", () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { detail: "some error string" },
      },
      message: "Request failed",
    };
    expect(getApiError(axiosError)).toBe("some error string");
  });

  it("returns COMPANY_INACTIVE for 403 without error_code", () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 403, data: {} },
      message: "Forbidden",
    };
    expect(getApiError(axiosError)).toBe("COMPANY_INACTIVE");
  });

  it("returns message when no response", () => {
    const axiosError = {
      isAxiosError: true,
      response: undefined,
      message: "Network Error",
    };
    expect(getApiError(axiosError)).toBe("Network Error");
  });

  it("returns CONNECTION_ERROR when no message and no response", () => {
    const axiosError = {
      isAxiosError: true,
      response: undefined,
      message: "",
    };
    expect(getApiError(axiosError)).toBe("CONNECTION_ERROR");
  });
});

// ---------------------------------------------------------------------------
// STATUS_STYLE
// ---------------------------------------------------------------------------

describe("STATUS_STYLE", () => {
  it("has entries for all main statuses", () => {
    const expected = [
      "BOOKED",
      "APPROVED_WAITING_DETAILS",
      "RESERVED_CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "CANCEL_PENDING",
    ];
    expected.forEach(status => {
      expect(STATUS_STYLE[status]).toBeDefined();
      expect(STATUS_STYLE[status].bg).toBeTruthy();
      expect(STATUS_STYLE[status].text).toBeTruthy();
    });
  });

  it("COMPLETED entry has correct bg class", () => {
    expect(STATUS_STYLE["COMPLETED"].bg).toBe("bg-gray-100");
  });
});

// ---------------------------------------------------------------------------
// TYPE_STYLE
// ---------------------------------------------------------------------------

describe("TYPE_STYLE", () => {
  it("has entries for INBOUND, OUTBOUND, ANY", () => {
    expect(TYPE_STYLE["INBOUND"]).toContain("blue");
    expect(TYPE_STYLE["OUTBOUND"]).toContain("emerald");
    expect(TYPE_STYLE["ANY"]).toContain("purple");
  });
});
