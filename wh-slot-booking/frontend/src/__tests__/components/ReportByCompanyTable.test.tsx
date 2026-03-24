import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportByCompanyTable from "../../components/reports/ReportByCompanyTable";
import type { ReportCompanyRow } from "../../hooks/useReports";

const makeRow = (overrides: Partial<ReportCompanyRow> = {}): ReportCompanyRow => ({
  company_id: 1,
  company_name: "ACME Corp",
  company_alias: "acme",
  total_reservations: 20,
  completed: 10,
  cancelled: 3,
  active: 7,
  inbound: 12,
  outbound: 8,
  any: 0,
  ...overrides,
});

describe("ReportByCompanyTable", () => {
  it("returns null when rows is empty", () => {
    const { container } = render(<ReportByCompanyTable rows={[]} lang="pl" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders company name", () => {
    render(<ReportByCompanyTable rows={[makeRow()]} lang="pl" />);
    expect(screen.getByText("ACME Corp")).toBeInTheDocument();
  });

  it("renders company alias", () => {
    render(<ReportByCompanyTable rows={[makeRow()]} lang="pl" />);
    expect(screen.getByText("acme")).toBeInTheDocument();
  });

  it("renders total reservations", () => {
    render(<ReportByCompanyTable rows={[makeRow({ total_reservations: 42 })]} lang="pl" />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders completion rate percentage", () => {
    // completed=10, total=20 → 50%
    render(<ReportByCompanyTable rows={[makeRow()]} lang="pl" />);
    expect(screen.getByText("(50%)")).toBeInTheDocument();
  });

  it("renders 0% completion rate when no reservations", () => {
    render(
      <ReportByCompanyTable
        rows={[makeRow({ total_reservations: 0, completed: 0 })]}
        lang="pl"
      />
    );
    expect(screen.getByText("(0%)")).toBeInTheDocument();
  });

  it("renders multiple companies", () => {
    const rows = [
      makeRow({ company_id: 1, company_name: "Alpha" }),
      makeRow({ company_id: 2, company_name: "Beta" }),
    ];
    render(<ReportByCompanyTable rows={rows} lang="pl" />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("renders inbound and outbound counts", () => {
    render(<ReportByCompanyTable rows={[makeRow({ inbound: 7, outbound: 5 })]} lang="pl" />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders with English labels", () => {
    render(<ReportByCompanyTable rows={[makeRow()]} lang="en" />);
    expect(screen.getByText("ACME Corp")).toBeInTheDocument();
  });
});
