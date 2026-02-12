import { Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';

import { DashboardComponent } from './student/dashboard/dashboard.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';

import { SeatBookingComponent } from './student/seat-booking/seat-booking-fixed.component';
import { AttendanceComponent } from './student/attendance/attendance.component';
import { ProfileComponent } from './student/profile/profile.component';
import { PaymentsComponent } from './student/payments/payments.component';
import { NotificationsComponent } from './student/notifications/notifications.component';

import { SeatManagementComponent } from './admin/seat-management/seat-management.component';
import { AttendancePanelComponent } from './admin/attendance-panel/attendance-panel.component';
import { PaymentVerificationComponent } from './admin/payment-verification/payment-verification.component';
import { NotificationsSenderComponent } from './admin/notifications-sender/notifications-sender.component';
import { FeedbackComponent } from './admin/feedback/feedback.component';
import { LeaderboardComponent } from './admin/leaderboard/leaderboard.component';
import { StudentManagementComponent } from './admin/student-management/student-management.component';

import { AuthGuard, AdminGuard, StudentGuard } from './guards/auth.guard';

export const routes: Routes = [
  /* ===== PUBLIC ROUTES ===== */
  { path: '', component: HomeComponent },

  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  /* ===== STUDENT ROUTES ===== */
  {
    path: 'student',
    component: DashboardComponent,
    canActivate: [AuthGuard, StudentGuard],
    children: [
      { path: 'book-seat', component: SeatBookingComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'notifications', component: NotificationsComponent },
    ],
  },

  /* ===== ADMIN ROUTES ===== */
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: 'student', component: StudentManagementComponent },
      { path: 'seats', component: SeatManagementComponent },
      { path: 'attendance', component: AttendancePanelComponent },
      { path: 'payments', component: PaymentVerificationComponent },
      { path: 'notifications', component: NotificationsSenderComponent },
      { path: 'feedback', component: FeedbackComponent },
      { path: 'leaderboard', component: LeaderboardComponent },
    ],
  },

  { path: '**', redirectTo: '' },
];
