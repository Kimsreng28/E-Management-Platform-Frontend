export interface Address {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
}
