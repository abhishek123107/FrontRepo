import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService, User } from './services/auth.service';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})


export class AppComponent {
  title = 'LibrarySeatBooking';

  
  sidebarOpen = false;
  

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
   
  }
checkUserStatus() {
    // यहाँ सुधार किया गया है: 'this.authService' का उपयोग करें
    const token = this.authService.getToken(); 
    if (token) {
      console.log('User is authenticated');
    }
  }

  /* ---------- Sidebar ---------- */
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  /* ---------- Auth ---------- */
  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isStudent(): boolean {
    return this.authService.isStudent();
  }

isAuthenticated(): boolean {
    const token = this.authService.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }

getCurrentUser(): User | null {
    return this.authService.getCurrentUser();
  }
  logout(): void {
    this.authService.logout();
    this.closeSidebar();
    this.router.navigate(['/']);
  }
}
