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
  private subscription: Subscription = new Subscription();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadCurrentUser();

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

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  hasActiveRoute(): boolean {
    // Check if we're on a child route (not the base dashboard)
    return this.router.url.includes('/student/');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
