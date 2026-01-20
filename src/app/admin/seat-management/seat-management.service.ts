import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Seat } from '../../models/seat.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SeatManagementService {
  private baseUrl = `${environment.apiUrl}/seats`;

  constructor(private http: HttpClient) {}

  // Get all seats
  getSeats(): Observable<Seat[]> {
    return this.http.get<any>(this.baseUrl).pipe(
      map((response: any) => response.results || response)
    );
  }

  // Get seat by ID
  getSeat(id: number): Observable<Seat> {
    return this.http.get<Seat>(`${this.baseUrl}/${id}/`);
  }

  // Create new seat
  createSeat(seatData: FormData): Observable<Seat> {
    const headers = new HttpHeaders();
    // Don't set Content-Type header for FormData - let browser set it with boundary
    return this.http.post<Seat>(this.baseUrl, seatData, { headers });
  }

  // Update seat
  updateSeat(id: number, seatData: FormData): Observable<Seat> {
    const headers = new HttpHeaders();
    // Use PUT for update
    return this.http.put<Seat>(`${this.baseUrl}/${id}/`, seatData, { headers });
  }

  // Delete seat
  deleteSeat(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }

  // Update seat status only
  updateSeatStatus(id: number, status: string): Observable<Seat> {
    return this.http.patch<Seat>(`${this.baseUrl}/${id}/`, { status });
  }
}
