import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  scan_confidence?: number;
  scanned_qr_token?: string;
  scanned_at?: string;
  scan_location?: string;
  device_info?: any;
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

export interface QRScanResult {
  success: boolean;
  qr_data?: string;
  confidence?: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  quality?: number;
  error?: string;
}

export interface AttendanceScanResult {
  success: boolean;
  message?: string;
  record?: AttendanceRecord;
  session?: string;
  check_in_time?: string;
  status?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = environment.apiUrl;

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

  /** Scan QR code from image */
  scanQRFromImage(imageFile: File): Observable<QRScanResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post<QRScanResult>(`${this.apiUrl}/attendance/scan-qr-image/`, formData);
  }

  /** Process QR code scan for attendance */
  processAttendanceScan(qrData: string, location?: string, deviceInfo?: any): Observable<AttendanceScanResult> {
    const body = {
      qr_data: qrData,
      location: location || 'Unknown',
      device_info: deviceInfo || {}
    };
    return this.http.post<AttendanceScanResult>(`${this.apiUrl}/attendance/process-scan/`, body);
  }

  /** Get device information for scanning */
  getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString(),
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    };
  }

  /** Get current location (if available) */
  getCurrentLocation(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve('Location not available');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(`${position.coords.latitude}, ${position.coords.longitude}`);
        },
        (error) => {
          resolve('Location access denied');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
}