import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { AuthService, User } from '../../services/auth.service';
import { StudentService, StudentDashboard, StudentProfile, StudentStats, RecentActivity } from '../../services/student.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    NavbarComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  loading = true;
  dashboardLoading = false;
  private subscription: Subscription = new Subscription();
  
  // Student Dashboard Data
  studentDashboard: StudentDashboard | null = null;
  studentProfile: StudentProfile | null = null;
  studentStats: StudentStats | null = null;
  recentActivities: RecentActivity[] = [];
  
  // UI State
  error: string | null = null;
  activeTab: string = 'overview';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadStudentDashboard();

    // Subscribe to user changes
    this.subscription.add(
      this.authService.currentUser$.subscribe((user: User | null) => {
        this.currentUser = user;
      })
    );
  }

  private loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      this.loading = false;
    } else {
      this.subscription.add(
        this.authService.getProfile().subscribe({
          next: (user: User) => {
            this.currentUser = user;
            this.loading = false;
          },
          error: (_error: any) => {
            console.error('Error loading profile:', _error);
            this.router.navigate(['/login']);
          },
        })
      );
    }
  }

  private loadStudentDashboard(): void {
    this.dashboardLoading = true;
    this.error = null;
    
    this.studentService.getStudentDashboard().subscribe({
      next: (dashboard: StudentDashboard) => {
        this.studentDashboard = dashboard;
        this.studentProfile = dashboard.profile;
        this.studentStats = dashboard.stats;
        this.recentActivities = dashboard.recent_activities;
        this.dashboardLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading student dashboard:', err);
        this.error = 'Failed to load dashboard data';
        this.dashboardLoading = false;
        
        // Fallback to individual calls if dashboard endpoint fails
        this.loadIndividualData();
      }
    });
  }

  private loadIndividualData(): void {
    this.dashboardLoading = true;
    
    // Load profile
    this.studentService.getStudentProfile().subscribe({
      next: (profile: StudentProfile) => {
        this.studentProfile = profile;
      },
      error: (err: any) => {
        console.error('Error loading profile:', err);
      }
    });

    // Load stats
    this.studentService.getStudentStats().subscribe({
      next: (stats: StudentStats) => {
        this.studentStats = stats;
        this.dashboardLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading stats:', err);
        this.dashboardLoading = false;
      }
    });

    // Load activities
    this.studentService.getRecentActivities(5).subscribe({
      next: (activities: RecentActivity[]) => {
        this.recentActivities = activities;
      },
      error: (err: any) => {
        console.error('Error loading activities:', err);
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  hasActiveRoute(): boolean {
    // Check if we're on a child route (not the base dashboard)
    return this.router.url.includes('/student/') && this.router.url !== '/student';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Helper methods for dashboard display
  getMembershipBadgeClass(membershipType?: string): string {
    if (!membershipType) return 'bg-secondary';
    
    switch (membershipType) {
      case 'vip': return 'bg-warning';
      case 'premium': return 'bg-info';
      case 'basic': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getActivityIcon(activityType?: string): string {
    if (!activityType) return 'bi-info-circle';
    
    switch (activityType) {
      case 'booking': return 'bi-calendar-check';
      case 'attendance': return 'bi-clock-history';
      case 'payment': return 'bi-credit-card';
      case 'profile_update': return 'bi-person-gear';
      default: return 'bi-info-circle';
    }
  }

  getActivityColor(activityType?: string): string {
    if (!activityType) return 'text-muted';
    
    switch (activityType) {
      case 'booking': return 'text-primary';
      case 'attendance': return 'text-success';
      case 'payment': return 'text-info';
      case 'profile_update': return 'text-warning';
      default: return 'text-muted';
    }
  }

  getStatusColor(status?: string): string {
    if (!status) return 'text-muted';
    
    switch (status) {
      case 'completed': return 'text-success';
      case 'pending': return 'text-warning';
      case 'cancelled': return 'text-danger';
      default: return 'text-muted';
    }
  }

  formatTimeAgo(timestamp?: string): string {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return time.toLocaleDateString();
  }

  refreshDashboard(): void {
    this.loadStudentDashboard();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
