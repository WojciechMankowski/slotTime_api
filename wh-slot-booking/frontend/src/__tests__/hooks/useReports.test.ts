import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useReports from "../../hooks/useReports";

// ---------------------------------------------------------------------------
// Mock the api module
// ---------------------------------------------------------------------------

vi.mock("../../API/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

// Import AFTER vi.mock so we get the mocked version
import { api } from "../../API/api";

const mockGet = api.get as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockSummary = {
  total: 10,
  available: 3,
  booked: 2,
  approved_waiting_details: 1,
  reserved_confirmed: 1,
  completed: 2,
  cancelled: 1,
  cancel_pending: 0,
  inbound: 5,
  outbound: 3,
  any: 2,
  utilization_pct: 70,
};

const mockDaily = [
  {
    date: "2025-06-01",
    total: 5,
    available: 1,
    booked: 1,
    approved_waiting_details: 0,
    reserved_confirmed: 0,
    completed: 2,
    cancelled: 1,
    cancel_pending: 0,
    inbound: 3,
    outbound: 2,
    any: 0,
    utilization_pct: 80,
  },
];

const mockByCompany = [
  {
    company_id: 1,
    company_name: "ACME",
    company_alias: "acme",
    total_reservations: 5,
    completed: 3,
    cancelled: 1,
    active: 1,
    inbound: 3,
    outbound: 2,
    any: 0,
  },
];

const mockByWarehouse = [
  {
    warehouse_id: 1,
    warehouse_name: "WH Main",
    warehouse_alias: "WHM",
    total: 10,
    available: 2,
    booked: 2,
    approved_waiting_details: 1,
    reserved_confirmed: 0,
    completed: 4,
    cancelled: 1,
    cancel_pending: 0,
    inbound: 6,
    outbound: 3,
    any: 1,
    utilization_pct: 80,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useReports – initial state", () => {
  it("starts with null summary and empty arrays", () => {
    const { result } = renderHook(() => useReports());
    expect(result.current.summary).toBeNull();
    expect(result.current.daily).toEqual([]);
    expect(result.current.byCompany).toEqual([]);
    expect(result.current.byWarehouse).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("initializes dateFrom to 30 days ago and dateTo to today", () => {
    const { result } = renderHook(() => useReports());
    const today = new Date().toISOString().slice(0, 10);
    expect(result.current.dateTo).toBe(today);
    expect(result.current.dateFrom).toBeTruthy();
    expect(result.current.dateFrom < today).toBe(true);
  });
});

describe("useReports – generate() without isSuperadmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet
      .mockResolvedValueOnce({ data: mockSummary })
      .mockResolvedValueOnce({ data: mockDaily })
      .mockResolvedValueOnce({ data: mockByCompany });
  });

  it("makes exactly 3 API calls (no by-warehouse)", async () => {
    const { result } = renderHook(() => useReports(false));
    await act(async () => {
      await result.current.generate();
    });
    expect(mockGet).toHaveBeenCalledTimes(3);
  });

  it("sets summary data after generate()", async () => {
    const { result } = renderHook(() => useReports());
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.summary).toEqual(mockSummary);
  });

  it("sets daily data after generate()", async () => {
    const { result } = renderHook(() => useReports());
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.daily).toEqual(mockDaily);
  });

  it("sets byCompany data after generate()", async () => {
    const { result } = renderHook(() => useReports());
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.byCompany).toEqual(mockByCompany);
  });

  it("byWarehouse remains empty when not superadmin", async () => {
    const { result } = renderHook(() => useReports(false));
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.byWarehouse).toEqual([]);
  });

  it("loading is false after successful generate()", async () => {
    const { result } = renderHook(() => useReports());
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("calls /api/reports/summary with date params", async () => {
    const { result } = renderHook(() => useReports());
    await act(async () => {
      await result.current.generate();
    });
    expect(mockGet).toHaveBeenCalledWith(
      "/api/reports/summary",
      expect.objectContaining({
        params: expect.objectContaining({
          date_from: expect.any(String),
          date_to: expect.any(String),
        }),
      })
    );
  });
});

describe("useReports – generate() with isSuperadmin=true", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet
      .mockResolvedValueOnce({ data: mockSummary })
      .mockResolvedValueOnce({ data: mockDaily })
      .mockResolvedValueOnce({ data: mockByCompany })
      .mockResolvedValueOnce({ data: mockByWarehouse });
  });

  it("makes 4 API calls when isSuperadmin=true", async () => {
    const { result } = renderHook(() => useReports(true));
    await act(async () => {
      await result.current.generate();
    });
    expect(mockGet).toHaveBeenCalledTimes(4);
  });

  it("sets byWarehouse data for superadmin", async () => {
    const { result } = renderHook(() => useReports(true));
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.byWarehouse).toEqual(mockByWarehouse);
  });

  it("calls /api/reports/by-warehouse endpoint", async () => {
    const { result } = renderHook(() => useReports(true));
    await act(async () => {
      await result.current.generate();
    });
    const calls = mockGet.mock.calls.map((c: any[]) => c[0]);
    expect(calls).toContain("/api/reports/by-warehouse");
  });
});

describe("useReports – error handling", () => {
  it("sets error code when API returns error response", async () => {
    vi.clearAllMocks();
    const axiosError = {
      response: { data: { detail: { error_code: "INVALID_DATE_RANGE" } } },
    };
    mockGet.mockRejectedValue(axiosError);

    const { result } = renderHook(() => useReports());
    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.error).toBe("INVALID_DATE_RANGE");
    expect(result.current.loading).toBe(false);
    expect(result.current.summary).toBeNull();
  });

  it("sets 'ERROR' fallback when response has no error_code", async () => {
    vi.clearAllMocks();
    mockGet.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useReports());
    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.error).toBe("ERROR");
  });

  it("clears previous error on new generate()", async () => {
    vi.clearAllMocks();
    mockGet.mockRejectedValueOnce({ response: { data: { detail: { error_code: "SOME_ERR" } } } });

    const { result } = renderHook(() => useReports());
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.error).toBe("SOME_ERR");

    // Second generate succeeds
    mockGet
      .mockResolvedValueOnce({ data: mockSummary })
      .mockResolvedValueOnce({ data: mockDaily })
      .mockResolvedValueOnce({ data: mockByCompany });

    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.error).toBeNull();
  });
});

describe("useReports – date setters", () => {
  it("setDateFrom updates dateFrom", () => {
    const { result } = renderHook(() => useReports());
    act(() => {
      result.current.setDateFrom("2025-01-01");
    });
    expect(result.current.dateFrom).toBe("2025-01-01");
  });

  it("setDateTo updates dateTo", () => {
    const { result } = renderHook(() => useReports());
    act(() => {
      result.current.setDateTo("2025-12-31");
    });
    expect(result.current.dateTo).toBe("2025-12-31");
  });
});
