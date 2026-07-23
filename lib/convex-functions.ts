import { makeFunctionReference } from "convex/server";

export type RevenueRange = "7d" | "30d" | "90d";

export interface RevenuePoint {
  date: string;
  amount: number;
  refunded: boolean;
}

export interface RevenueResult {
  total: number;
  changePct: number;
  dip: RevenuePoint | null;
  series: RevenuePoint[];
}

export interface TicketRecord {
  ticketId: number;
  subject: string;
  team: string;
  status: "open" | "closed";
  createdAt: number;
}

export const getRevenueRef = makeFunctionReference<
  "query",
  { range: RevenueRange },
  RevenueResult
>("revenue:getRevenue");

export const createTicketRef = makeFunctionReference<
  "mutation",
  { subject: string; team: string },
  number
>("tickets:createTicket");

export const listRecentTicketsRef = makeFunctionReference<
  "query",
  { limit?: number },
  TicketRecord[]
>("tickets:listRecent");

export const getOpenCountRef = makeFunctionReference<
  "query",
  Record<string, never>,
  number
>("tickets:getOpenCount");

