export interface Seat {
  id: number;
  number: number;
  status: 'available' | 'booked' | 'maintenance';
  photo: string;
  selected?: boolean; // Added for seat selection in booking component
}