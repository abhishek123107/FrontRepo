import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationsService, Notification } from '../../services/notifications.service';

@Component({
  selector: 'app-notifications-sender',
  standalone: true,
  imports: [FormsModule, CommonModule, DatePipe],
  templateUrl: './notifications-sender.component.html',
  styleUrl: './notifications-sender.component.css',
})
export class NotificationsSenderComponent implements OnInit {
  notification: Partial<Notification> = {
    type: 'info' as Notification['type'],
    title: '',
    message: '',
    target_audience: 'all' as Notification['target_audience'],
    is_active: true,
  };

  successMessage = '';
  errorMessage = '';
  loading = false;

  sentNotifications: Notification[] = [];

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit(): void {
    this.loadSentNotifications();
  }

  templates = {
    expiry: {
      type: 'warning' as Notification['type'],
      title: 'Membership Expiring Soon',
      message: 'Your library membership is expiring in 3 days. Please renew to continue enjoying our services.',
      target_audience: 'students' as Notification['target_audience']
    },
    maintenance: {
      type: 'info' as Notification['type'],
      title: 'Library Maintenance Notice',
      message: 'The library will be closed for maintenance on Sunday from 10 AM to 2 PM. We apologize for any inconvenience.',
      target_audience: 'all' as Notification['target_audience']
    },
    holiday: {
      type: 'info' as Notification['type'],
      title: 'Holiday Notice',
      message: 'The library will remain closed on Republic Day (January 26). Normal operations will resume on January 27.',
      target_audience: 'all' as Notification['target_audience']
    },
    rules: {
      type: 'warning' as Notification['type'],
      title: 'Library Rules Reminder',
      message: 'Please remember to maintain silence, return books on time, and keep the premises clean. Thank you for your cooperation.',
      target_audience: 'students' as Notification['target_audience']
    },
  };

  loadSentNotifications(): void {
    this.notificationsService.getAllNotifications().subscribe({
      next: (notifications) => {
        this.sentNotifications = notifications;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        // Fallback to mock data
        this.loadMockNotifications();
      }
    });
  }

  loadTemplate(templateKey: string): void {
    const template = this.templates[templateKey as keyof typeof this.templates];
    if (template) {
      this.notification = {
        type: template.type as Notification['type'],
        title: template.title,
        message: template.message,
        target_audience: template.target_audience as Notification['target_audience'],
        is_active: true
      };
    }
  }

  sendNotification(form: any): void {
    if (!form.valid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.notificationsService.createNotification(this.notification).subscribe({
      next: (createdNotification) => {
        this.loading = false;
        this.successMessage = '✅ Notification sent successfully!';

        // Add to sent notifications list
        this.sentNotifications.unshift(createdNotification);

        // Reset form
        this.notification = {
          type: 'info',
          title: '',
          message: '',
          target_audience: 'all',
          is_active: true,
        };

        // Clear success message after 5 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error sending notification:', err);
        this.errorMessage = err.error?.detail || err.error?.message || 'Failed to send notification';

        // Fallback: simulate success for demo
        this.simulateNotificationSend();
      }
    });
  }

  private simulateNotificationSend(): void {
    // Simulate success for demo purposes when API fails
    this.loading = false;
    this.successMessage = '✅ Notification sent successfully! (Demo Mode)';

    // Add to sent notifications
    const mockNotification: Notification = {
      id: Date.now(),
      title: this.notification.title || 'Notification',
      message: this.notification.message || '',
      type: this.notification.type || 'info',
      target_audience: this.notification.target_audience || 'all',
      is_active: true,
      created_at: new Date().toISOString(),
      recipient_count: 25
    };

    this.sentNotifications.unshift(mockNotification);

    // Reset form
    this.notification = {
      type: 'info',
      title: '',
      message: '',
      target_audience: 'all',
      is_active: true,
    };
  }

  trackByNotificationId(index: number, item: Notification): number {
    return item.id || index;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return 'fas fa-check-circle text-success';
      case 'warning': return 'fas fa-exclamation-triangle text-warning';
      case 'danger': return 'fas fa-exclamation-circle text-danger';
      default: return 'fas fa-info-circle text-info';
    }
  }

  resetForm(): void {
    this.notification = {
      type: 'info' as Notification['type'],
      title: '',
      message: '',
      target_audience: 'all' as Notification['target_audience'],
      is_active: true,
    };
  }

  private loadMockNotifications(): void {
    this.sentNotifications = [
      {
        id: 1,
        title: 'Welcome Message',
        message: 'Welcome to the Library Management System!',
        type: 'info',
        target_audience: 'all',
        is_active: true,
        created_at: '2024-01-15T10:00:00Z',
        recipient_count: 150
      },
      {
        id: 2,
        title: 'Library Hours Update',
        message: 'Library will now remain open until 10 PM on weekdays.',
        type: 'info',
        target_audience: 'students',
        is_active: true,
        created_at: '2024-01-14T14:30:00Z',
        recipient_count: 120
      }
    ];
  }
}
