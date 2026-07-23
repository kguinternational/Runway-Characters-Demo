export type RevenueRange = "7d" | "30d" | "90d";

export interface RevenuePoint {
  date: string;
  amount: number;
  refunded?: boolean;
}

export interface RevenueDip {
  date: string;
  amount: number;
  reason?: string;
}

export interface RevenueResult {
  total: number;
  changePct: number;
  dip?: RevenueDip | null;
  series: RevenuePoint[];
}

export interface TicketRecord {
  _id?: string;
  ticketId: number;
  subject: string;
  team: string;
  status: "open" | "closed";
  createdAt: number;
}

export interface InfoPanelState {
  title: string;
  body: string;
}
