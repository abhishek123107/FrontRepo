import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Seat } from '../models/seat.model';

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
  private apiUrl = 'http://localhost:8001/api'; // Base API URL - updated to match Django server

  constructor(private http: HttpClient) {}

  // Fetch seats from backend
  getSeats(): Observable<Seat[]> {
    return this.http.get<any>(`${this.apiUrl}/seats/`).pipe(
      map((response: any) => {
        // Handle paginated response
        if (response && typeof response === 'object' && 'results' in response) {
          return response.results as Seat[];
        }
        return response as Seat[];
      })
    );
  }

  // Create booking (for offline payments)
  bookSeat(booking: SeatBooking): Observable<SeatBooking> {
    const bookingData = {
      seat: booking.seat,
      start_time: booking.start_time,
      end_time: booking.end_time,
      purpose: booking.purpose,  // This will be mapped to 'plan' in backend
      payment_method: 'offline',  // Default to offline payment
    };
    return this.http.post<SeatBooking>(`${this.apiUrl}/bookings/`, bookingData);
  }

  // Create booking with payment screenshot (for online payments)
  bookSeatWithPayment(formData: FormData): Observable<SeatBooking> {
    // FormData should contain: seat, start_time, end_time, purpose, payment_screenshot
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
