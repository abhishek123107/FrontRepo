import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { AuthService, User } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Activity {
  title: string;
  description: string;
  timestamp: Date;
}

interface Booking {
  id: number;
  seat: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface AttendanceRecord {
  id: number;
  user: string;
  entry_time: string;
  exit_time: string | null;
  date: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NavbarComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  stats = {
    totalStudents: 0,
    activeBookings: 0,
    pendingPayments: 0,
    todayAttendance: 0,
  };
  recentActivities: Activity[] = [];
  bookings: Booking[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  loading = true;

  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();

    // Subscribe to user changes
    this.subscription.add(
      this.authService.currentUser$.subscribe((user: User | null) => {
        this.currentUser = user;
      })
    );
  }

  private loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.subscription.add(
        this.authService.getProfile().subscribe({
          next: (user: User) => {
            this.currentUser = user;
            if (!this.isAdmin()) {
              this.router.navigate(['/student']);
            }
          },
          error: (_error: any) => this.router.navigate(['/login']),
        })
      );
    } else if (!this.isAdmin()) {
      this.router.navigate(['/student']);
    }
  }

  isAdmin(): boolean {
    return !!(this.currentUser?.is_staff || this.currentUser?.is_superuser);
  }

  private loadDashboardData(): void {
    const token = this.authService.getToken();
    const headers: { [key: string]: string } = token ? { 'Authorization': `Bearer ${token}` } : {};

    // Load bookings
    this.subscription.add(
      this.http.get<any>(`${environment.apiUrl}/bookings/`, { headers }).subscribe({
        next: (response: any) => {
          // Handle paginated response
          const bookings = response.results || response;
          this.bookings = bookings;
          this.stats.activeBookings = bookings.filter(
            (b: any) => b.status === 'active'
          ).length;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading bookings:', error);
          this.loading = false;
        },
      })
    );

    // Load attendance records
    this.subscription.add(
      this.http.get<any>(`${environment.apiUrl}/records/`, { headers }).subscribe({
        next: (response: any) => {
          // Handle paginated response
          const records = response.results || response;
          this.attendanceRecords = records;
          const today = new Date().toISOString().split('T')[0];
          this.stats.todayAttendance = records.filter(
            (r: any) => r.date === today
          ).length;
        },
        error: (error: any) => {
          console.error('Error loading attendance:', error);
        },
      })
    );

    // Example recent activity
    this.recentActivities.push({
      title: 'Dashboard Loaded',
      description: 'Admin dashboard initialized with real-time data',
      timestamp: new Date(),
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
