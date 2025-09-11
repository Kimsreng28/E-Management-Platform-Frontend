import { User } from "@/contexts/ChatContext";
import { Order } from "./order";

// types/delivery.ts
export type DeliveryStatus =
  | "assigned"
  | "accepted"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "completed";

export interface Delivery {
  id: number;
  order_id: number;
  delivery_agent_id: number;
  status: DeliveryStatus;
  assigned_at: string | null;
  picked_up_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  received_at: string | null;
  customer_accepted_at: string | null;
  delivery_notes?: string | null;
  tracking_number: string;
  delivery_fee?: number | null;
  distance?: number | null;
  agent_lat?: number | null;
  agent_lng?: number | null;
  estimated_arrival_time?: string | null;
  delivery_options?: DeliveryOptions;

  // Relationships
  order?: Order;
  agent?: User;
  trackingHistory?: DeliveryTracking[];
}

export interface DeliveryOptions {
  instructions?: string;
  leave_at_door?: boolean;
  signature_required?: boolean;
  preferred_time_window?: string;
}

export interface DeliveryTracking {
  id: number;
  delivery_id: number;
  status: DeliveryStatus;
  notes?: string | null;
  lat?: number | null;
  lng?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPreferences {
  id: number;
  user_id: number;
  delivery_type: "standard" | "express" | "scheduled";
  preferred_delivery_time?: string | null;
  delivery_instructions?: string | null;
  leave_at_door?: boolean;
  signature_required?: boolean;
}
