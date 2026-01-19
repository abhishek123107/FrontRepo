import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface StudentProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  student_id?: string;
  department?: string;
  year_of_study?: number;
  membership_type: 'basic' | 'premium' | 'vip';
  membership_expiry?: string;
  avatar?: string;
  total_bookings: number;
  total_attendance_hours: number;
  consistency_score: number;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
}

export interface StudentStats {
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_attendance_days: number;
  attendance_percentage: number;
  total_payments: number;
  pending_payments: number;
  membership_status: string;
  days_until_expiry: number;
}

export interface RecentActivity {
  id: number;
  type: 'booking' | 'attendance' | 'payment' | 'profile_update';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'cancelled';
}

export interface StudentDashboard {
  profile: StudentProfile;
  stats: StudentStats;
  recent_activities: RecentActivity[];
  notifications: any[];
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      if (error.status === 0) {
        console.error('Connection refused - Backend server may not be running');
      } else if (error.status === 401) {
        console.error('Unauthorized - Token may be expired');
        this.authService.logout();
      } else if (error.status === 403) {
        console.error('Forbidden - Insufficient permissions');
      } else if (error.status === 404) {
        console.error('Not found - Endpoint may not exist');
      } else if (error.status >= 500) {
        console.error('Server error - Backend issue');
      }
      
      return throwError(() => error);
    };
  }

  // Get complete student dashboard data
  getStudentDashboard(): Observable<StudentDashboard> {
    const headers = this.getAuthHeaders();
    return this.http.get<StudentDashboard>(`${this.apiUrl}/accounts/student/dashboard/`, { headers })
      .pipe(catchError(this.handleError<StudentDashboard>('getStudentDashboard')));
  }

  // Get student profile
  getStudentProfile(): Observable<StudentProfile> {
    const headers = this.getAuthHeaders();
    return this.http.get<StudentProfile>(`${this.apiUrl}/accounts/student/profile/`, { headers })
      .pipe(catchError(this.handleError<StudentProfile>('getStudentProfile')));
  }

  // Update student profile
  updateStudentProfile(profileData: Partial<StudentProfile>): Observable<StudentProfile> {
    const headers = this.getAuthHeaders();
    return this.http.put<StudentProfile>(`${this.apiUrl}/accounts/student/profile/update/`, profileData, { headers });
  }

  // Get student statistics
  getStudentStats(): Observable<StudentStats> {
    const headers = this.getAuthHeaders();
    return this.http.get<StudentStats>(`${this.apiUrl}/accounts/student/stats/`, { headers })
      .pipe(catchError(this.handleError<StudentStats>('getStudentStats')));
  }

  // Get recent activities
  getRecentActivities(limit: number = 10): Observable<RecentActivity[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/accounts/student/activities/?limit=${limit}`, { headers })
      .pipe(catchError(this.handleError<RecentActivity[]>('getRecentActivities')));
  }

  // Get student bookings
  getStudentBookings(status?: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/accounts/student/bookings/`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<any[]>(url, { headers });
  }

  // Get student attendance records
  getStudentAttendance(startDate?: string, endDate?: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/accounts/student/attendance/`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get<any[]>(url, { headers });
  }

  // Get student payment history
  getStudentPayments(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/accounts/student/payments/`, { headers });
  }

  // Upload avatar
  uploadAvatar(file: File): Observable<{ avatar: string }> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.http.post<{ avatar: string }>(`${this.apiUrl}/accounts/student/upload-avatar/`, formData, { headers });
  }

  // Change password
  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ message: string }>(`${this.apiUrl}/accounts/student/change-password/`, {
      old_password: oldPassword,
      new_password: newPassword
    }, { headers });
  }

  // Get membership details
  getMembershipDetails(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/accounts/student/membership/`, { headers });
  }

  // Upgrade membership
  upgradeMembership(membershipType: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/accounts/student/upgrade-membership/`, {
      membership_type: membershipType
    }, { headers });
  }

  // Get notifications
  getNotifications(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/accounts/student/notifications/`, { headers });
  }

  // Mark notification as read
  markNotificationAsRead(notificationId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/accounts/student/notifications/${notificationId}/read/`, {}, { headers });
  }

  // Get student leaderboard position
  getLeaderboardPosition(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/accounts/student/leaderboard/`, { headers });
  }
}
