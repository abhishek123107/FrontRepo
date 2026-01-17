import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AttendanceRecord {
  id?: number;
  user?: number;
  session?: number;
  status: 'present' | 'late' | 'absent' | 'excused';
  check_in_time?: string;
  check_out_time?: string;
  duration_minutes?: number;
  notes?: string;
  seat_booking?: number;
  verified_by_qr?: boolean;
  verification_method?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceSession {
  id?: number;
  title: string;
  description?: string;
  session_type: 'study' | 'class' | 'exam' | 'event';
  start_time: string;
  end_time: string;
  check_in_deadline?: string;
  room?: number;
  instructor?: string;
  max_participants?: number;
  is_mandatory?: boolean;
  is_active?: boolean;
  created_by?: number;
  created_at?: string;
  qr_code_data?: string;
  qr_code_token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = 'http://localhost:8001/api';

  constructor(private http: HttpClient) { }

  /** Get active attendance sessions */
  getActiveSessions(): Observable<AttendanceSession[]> {
    return this.http.get<AttendanceSession[]>(`${this.apiUrl}/attendance/sessions/?is_active=true`);
  }

  /** Get user's attendance records */
  getMyAttendance(): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/attendance/my-attendance/`);
  }

  /** Check in using QR code */
  qrCheckIn(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/qr-checkin/${token}/`, {});
  }

  /** Manual check-in (admin only) */
  adminCheckIn(sessionId: number, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/admin-checkin/${sessionId}/`, {
      user_id: userId
    });
  }

  /** Check out from session */
  checkOut(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/check-out/${bookingId}/`, {});
  }

  /** Get attendance statistics for admin */
  getAttendanceStats(sessionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/session-stats/${sessionId}/`);
  }

  /** Generate attendance report */
  getAttendanceReport(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/report/`, { params });
  }
}