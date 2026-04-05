import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Seat } from '../models/seat.model';
import { environment } from '../../environments/environment';

export interface SeatBooking {
  id?: number;
  user?: number;
  seat: number;
  start_time: string;
  end_time: string;
  purpose: string; // Matches backend 'purpose' field
  payment_method?: string;
  status?: string;
  payment_id?: number;
  transaction_id?: string;
  created_at?: string;
  payment_screenshot?: File;
  total_amount?: number;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SeatBookingService {
  private apiUrl = environment.apiUrl; // Base API URL from environment

  constructor(private http: HttpClient) {}

  // Fetch seats from backend
  getSeats(): Observable<Seat[]> {
    return this.http.get<any>(`${this.apiUrl}/seats/`).pipe(
      map((response: any) => {
        // Handle paginated response
        if (response && typeof response === 'object' && 'results' in response) {
          return response.results.map((seat: any) => ({
            id: seat.id,
            seat_number: seat.number, // Map 'number' to 'seat_number'
            status: seat.status,
            photo: seat.photo,
          })) as Seat[];
        }
        return [];
      }),
    );
  }

  // Create booking (for offline payments)
  bookSeat(booking: SeatBooking): Observable<SeatBooking> {
    const planValue = this.mapTimingToPlan(booking.purpose);
    console.log('🔍 DEBUG: Sending plan value:', JSON.stringify(planValue));
    console.log('🔍 DEBUG: Original purpose:', JSON.stringify(booking.purpose));
    
    const bookingData = {
      seat: booking.seat,
      start_time: booking.start_time,
      end_time: booking.end_time,
      plan: planValue, // Map timing to backend plan choices
      payment_method: 'offline', // Default to offline payment
    };
    console.log('🔍 DEBUG: Full booking data:', JSON.stringify(bookingData, null, 2));
    return this.http.post<SeatBooking>(`${this.apiUrl}/bookings/`, bookingData);
  }

  // Map timing values to backend plan choices
  private mapTimingToPlan(timing: string): string {
    // Try different patterns based on common Django choice conventions
    const planMapping: { [key: string]: string } = {
      'morning': '1', // Try numeric codes first
      'afternoon': '2', 
      'evening': '3',
      'full-day': '4',
      'night': '5',
      '24-7': '6'
    };
    
    // Fallback to other patterns if numeric doesn't work
    const fallbackMapping: { [key: string]: string } = {
      'morning': 'morning_shift',
      'afternoon': 'afternoon_shift', 
      'evening': 'evening_shift',
      'full-day': 'full_day',
      'night': 'night_shift',
      '24-7': 'full_access'
    };
    
    return planMapping[timing] || fallbackMapping[timing] || '1';
  }

  // Create booking with payment screenshot (for online payments)
  bookSeatWithPayment(formData: FormData): Observable<SeatBooking> {
    // Replace purpose with plan in FormData
    if (formData.has('purpose')) {
      const purposeValue = formData.get('purpose') as string;
      formData.delete('purpose');
      formData.append('plan', this.mapTimingToPlan(purposeValue));
    }
    // FormData should contain: seat, start_time, end_time, plan, payment_screenshot
    return this.http.post<SeatBooking>(`${this.apiUrl}/bookings/`, formData);
  }

  // Get user's booking history
  getBookingHistory(): Observable<SeatBooking[]> {
    return this.http.get<SeatBooking[]>(`${this.apiUrl}/bookings/`);
  }

  // Cancel a booking
  cancelBooking(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings/${bookingId}/cancel/`, {});
  }
}
