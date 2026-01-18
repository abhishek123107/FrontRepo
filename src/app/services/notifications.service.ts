import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  id?: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  target_audience: 'all' | 'students' | 'staff' | 'specific_users';
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  sent_at?: string;
  recipient_count?: number;
}

export interface UserNotification {
  id?: number;
  user: number;
  notification: Notification;
  is_read: boolean;
  read_at?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /** Get notifications for current user */
  getMyNotifications(): Observable<UserNotification[]> {
    return this.http.get<UserNotification[]>(`${this.apiUrl}/notifications/my-notifications/`);
  }

  /** Get all notifications (admin only) */
  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications/`);
  }

  /** Create new notification (admin only) */
  createNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/notifications/`, notification);
  }

  /** Mark notification as read */
  markAsRead(notificationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications/user-notifications/${notificationId}/mark-as-read/`, {});
  }

  /** Delete notification (admin only) */
  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/${notificationId}/`);
  }

  /** Get notification statistics (admin only) */
  getNotificationStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications/stats/`);
  }
}