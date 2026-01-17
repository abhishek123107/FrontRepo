import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AttendanceService,
  AttendanceSession,
  AttendanceRecord,
} from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css',
})
export class AttendanceComponent implements OnInit {
  attendanceStatus: string | null = null;
  activeSessions: AttendanceSession[] = [];
  myAttendance: AttendanceRecord[] = [];
  selectedSession: AttendanceSession | null = null;
  qrCodeInput: string = '';
  loading = false;

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Temporarily disabled - attendance endpoints not implemented in backend
    // this.loadActiveSessions();
    // this.loadMyAttendance();

    // Show message that attendance feature is coming soon
    console.log('Attendance feature is not yet implemented in backend');
  }

  loadActiveSessions() {
    // Temporarily disabled - backend not implemented
    this.loading = false;
    console.log('loadActiveSessions: Feature not implemented yet');
  }

  loadMyAttendance() {
    // Temporarily disabled - backend not implemented
    console.log('loadMyAttendance: Feature not implemented yet');
  }

  scanQRCode() {
    if (!this.qrCodeInput.trim()) {
      alert('कृपया QR कोड टोकन दर्ज करें');
      return;
    }

    this.loading = true;
    this.attendanceService.qrCheckIn(this.qrCodeInput.trim()).subscribe({
      next: (response) => {
        this.loading = false;
        this.attendanceStatus = 'marked';
        alert('✅ उपस्थिति सफलतापूर्वक दर्ज की गई!');
        this.qrCodeInput = '';
        this.loadMyAttendance(); // Refresh attendance list
      },
      error: (err) => {
        this.loading = false;
        console.error('QR check-in error:', err);
        const errorMsg =
          err.error?.error || 'QR कोड अमान्य है या सत्र सक्रिय नहीं है';
        alert(`❌ उपस्थिति दर्ज करने में त्रुटि: ${errorMsg}`);
      },
    });
  }

  requestAdminApproval() {
    if (!this.selectedSession) {
      alert('कृपया एक सत्र चुनें');
      return;
    }

    this.loading = true;
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      alert('उपयोगकर्ता जानकारी नहीं मिली');
      return;
    }

    this.attendanceService
      .adminCheckIn(this.selectedSession.id!, user.id)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.attendanceStatus = 'pending';
          alert('✅ एडमिन अप्रूवल के लिए अनुरोध भेज दिया गया है');
          this.loadMyAttendance();
        },
        error: (err) => {
          this.loading = false;
          console.error('Admin approval error:', err);
          const errorMsg = err.error?.error || 'अनुरोध भेजने में त्रुटि हुई';
          alert(`❌ त्रुटि: ${errorMsg}`);
        },
      });
  }

  selectSession(session: AttendanceSession) {
    this.selectedSession = session;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      present: 'उपस्थित',
      late: 'देरी से',
      absent: 'अनुपस्थित',
      excused: 'छूट प्राप्त',
    };
    return statusMap[status] || status;
  }

  getSessionTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      study: 'अध्ययन सत्र',
      class: 'कक्षा',
      exam: 'परीक्षा',
      event: 'कार्यक्रम',
    };
    return typeMap[type] || type;
  }
}
