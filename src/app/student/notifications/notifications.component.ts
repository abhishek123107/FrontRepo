import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService, UserNotification, Notification } from '../../services/notifications.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit {
  userNotifications: UserNotification[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private notificationsService: NotificationsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = null;

    this.notificationsService.getMyNotifications().subscribe({
      next: (notifications) => {
        this.userNotifications = notifications;
        this.loading = false;
        console.log('✅ Notifications loaded:', notifications);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load notifications';
        console.error('❌ Error loading notifications:', err);

        // Fallback to mock data if API fails
        this.loadMockNotifications();
      }
    });
  }

  markAsRead(userNotification: UserNotification): void {
    if (userNotification.notification && userNotification.notification.id) {
      this.notificationsService.markAsRead(userNotification.notification.id).subscribe({
        next: () => {
          userNotification.is_read = true;
          userNotification.read_at = new Date().toISOString();
          console.log('✅ Notification marked as read');
        },
        error: (err) => {
          console.error('❌ Error marking notification as read:', err);
          // Still mark as read locally for better UX
          userNotification.is_read = true;
        }
      });
    }
  }

  private loadMockNotifications(): void {
    // Fallback mock data in case API is not available
    this.userNotifications = [
      {
        id: 1,
        user: 1,
        is_read: false,
        notification: {
          id: 1,
          title: 'Welcome to Library Management System',
          message: 'Welcome to our new Library Seat Booking System! You can now book seats, mark attendance, and manage your library activities online.',
          type: 'info',
          target_audience: 'all',
          is_active: true,
          created_at: '2024-01-15T10:00:00Z'
        },
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        user: 1,
        is_read: false,
        notification: {
          id: 2,
          title: 'Library Hours Update',
          message: 'Library will remain open until 10 PM on weekdays starting next week. Plan your study sessions accordingly.',
          type: 'info',
          target_audience: 'students',
          is_active: true,
          created_at: '2024-01-10T14:30:00Z'
        },
        created_at: '2024-01-10T14:30:00Z'
      },
      {
        id: 3,
        user: 1,
        is_read: true,
        notification: {
          id: 3,
          title: 'Payment Reminder',
          message: 'Your membership payment is due in 3 days. Please complete your payment to avoid service interruption.',
          type: 'warning',
          target_audience: 'students',
          is_active: true,
          created_at: '2024-01-05T09:15:00Z'
        },
        read_at: '2024-01-05T09:30:00Z',
        created_at: '2024-01-05T09:15:00Z'
      }
    ];
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return 'fas fa-check-circle text-success';
      case 'warning': return 'fas fa-exclamation-triangle text-warning';
      case 'danger': return 'fas fa-exclamation-circle text-danger';
      default: return 'fas fa-info-circle text-info';
    }
  }

  trackByNotificationId(index: number, item: UserNotification): number {
    return item.id || item.notification?.id || index;
  }

  get unreadCount(): number {
    return this.userNotifications.filter(n => !n.is_read).length;
  }

  get readCount(): number {
    return this.userNotifications.filter(n => n.is_read).length;
  }

  getNotificationBadgeClass(type: string): string {
    switch (type) {
      case 'success': return 'badge bg-success';
      case 'warning': return 'badge bg-warning';
      case 'danger': return 'badge bg-danger';
      default: return 'badge bg-info';
    }
  }
}
