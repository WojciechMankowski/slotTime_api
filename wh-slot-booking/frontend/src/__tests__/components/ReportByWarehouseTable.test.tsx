import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportByWarehouseTable from "../../components/reports/ReportByWarehouseTable";
import type { ReportWarehouseRow } from "../../hooks/useReports";

const makeRow = (overrides: Partial<ReportWarehouseRow> = {}): ReportWarehouseRow => ({
  warehouse_id: 1,
  warehouse_name: "Main Warehouse",
  warehouse_alias: "MWH",
  total: 50,
  available: 10,
  booked: 8,
  approved_waiting_details: 3,
  reserved_confirmed: 2,
  completed: 20,
  cancelled: 5,
  cancel_pending: 2,
  inbound: 30,
  outbound: 15,
  any: 5,
  utilization_pct: 80,
  ...overrides,
});

describe("ReportByWarehouseTable", () => {
  it("returns null when rows is empty", () => {
    const { container } = render(<ReportByWarehouseTable rows={[]} lang="pl" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders warehouse name", () => {
    render(<ReportByWarehouseTable rows={[makeRow()]} lang="pl" />);
    expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
  });

  it("renders warehouse alias", () => {
    render(<ReportByWarehouseTable rows={[makeRow()]} lang="pl" />);
    expect(screen.getByText("MWH")).toBeInTheDocument();
  });

  it("renders total count", () => {
    render(<ReportByWarehouseTable rows={[makeRow({ total: 99 })]} lang="pl" />);
    expect(screen.getByText("99")).toBeInTheDocument();
  });

  it("renders utilization percentage", () => {
    render(<ReportByWarehouseTable rows={[makeRow({ utilization_pct: 75 })]} lang="pl" />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("utilization badge has emerald class for >= 80%", () => {
    const { container } = render(
      <ReportByWarehouseTable rows={[makeRow({ utilization_pct: 90 })]} lang="pl" />
    );
    expect(container.innerHTML).toContain("emerald");
  });

  it("utilization badge has amber class for >= 50% and < 80%", () => {
    const { container } = render(
      <ReportByWarehouseTable rows={[makeRow({ utilization_pct: 60 })]} lang="pl" />
    );
    expect(container.innerHTML).toContain("amber");
  });

  it("utilization badge has red class for < 50%", () => {
    const { container } = render(
      <ReportByWarehouseTable rows={[makeRow({ utilization_pct: 20 })]} lang="pl" />
    );
    expect(container.innerHTML).toContain("red");
  });

  it("renders mini progress bar element", () => {
    const { container } = render(<ReportByWarehouseTable rows={[makeRow()]} lang="pl" />);
    // progress bar is a div with bg-indigo-500 and inline style width
    const bar = container.querySelector(".bg-indigo-500");
    expect(bar).toBeTruthy();
  });

  it("progress bar width scales relative to max total", () => {
    const rows = [
      makeRow({ warehouse_id: 1, total: 100 }),
      makeRow({ warehouse_id: 2, warehouse_name: "Small WH", warehouse_alias: "SWH", total: 50 }),
    ];
    const { container } = render(<ReportByWarehouseTable rows={rows} lang="pl" />);
    const bars = container.querySelectorAll(".bg-indigo-500");
    expect(bars.length).toBe(2);
    // first row (max) should be 100%, second 50%
    expect((bars[0] as HTMLElement).style.width).toBe("100%");
    expect((bars[1] as HTMLElement).style.width).toBe("50%");
  });

  it("renders multiple warehouses", () => {
    const rows = [
      makeRow({ warehouse_id: 1, warehouse_name: "WH Alpha" }),
      makeRow({ warehouse_id: 2, warehouse_name: "WH Beta" }),
    ];
    render(<ReportByWarehouseTable rows={rows} lang="pl" />);
    expect(screen.getByText("WH Alpha")).toBeInTheDocument();
    expect(screen.getByText("WH Beta")).toBeInTheDocument();
  });

  it("renders with English labels", () => {
    render(<ReportByWarehouseTable rows={[makeRow()]} lang="en" />);
    expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
  });
});
