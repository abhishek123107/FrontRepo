export interface Seat {
  id: number;
  seat_number: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  photo?: string;
  selected?: boolean; // Added for seat selection in booking component
  has_power_outlet?: boolean;
  has_monitor?: boolean;
  is_near_window?: boolean;
  is_accessible?: boolean;
  seat_type?: 'regular' | 'premium' | 'vip' | 'group';
  room?: number;
  imageError?: boolean; // Added to track image loading errors
  time_slot?: 'morning' | 'afternoon' | 'evening' | 'night' | 'full-day' | '24-7'; // Added for time slot management
}