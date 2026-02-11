import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface AttendanceRecord {
  id: number;
  studentName: string;
  seatNumber: number;
  checkInTime: Date;
  checkOutTime?: Date;
  status: 'present' | 'absent' | 'pending';
}

interface AttendanceSession {
  id?: number;
  title: string;
  description?: string;
  session_type: 'study' | 'class' | 'exam' | 'event';
  start_time: string;
  end_time: string;
  is_active?: boolean;
  qr_code_data?: string;
  qr_code_token?: string;
}

interface QRCodeData {
  qr_token: string;
  session_id: number;
  date: string;
  created: boolean;
  qr_data: {
    type: string;
    date: string;
    token: string;
    session_id: number;
    generated_by: string;
  };
}

@Component({
  selector: 'app-attendance-panel',
  standalone: true,
  imports: [FormsModule, CommonModule, DatePipe, RouterOutlet],
  templateUrl: './attendance-panel.component.html',
  styleUrl: './attendance-panel.component.css',
})
export class AttendancePanelComponent implements OnInit {
  selectedDate: string = new Date().toISOString().split('T')[0];
  statusFilter: string = 'all';
  qrCodeData: QRCodeData | null = null;
  attendanceRecords: AttendanceRecord[] = [];
  filteredAttendance: AttendanceRecord[] = [];
  sessions: AttendanceSession[] = [];
  selectedSession: AttendanceSession | null = null;
  loading = false;
  error: string | null = null;
  qrLoading = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadSessions();
    this.loadAttendance();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  loadSessions() {
    this.loading = true;
    const headers = this.getAuthHeaders();
    
    this.http.get<AttendanceSession[]>(`${environment.apiUrl}/attendance/sessions/`, { headers })
      .subscribe({
        next: (sessions) => {
          this.sessions = sessions;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.error('Error loading sessions:', err);
          this.error = 'Failed to load attendance sessions';
        }
      });
  }

  loadAttendance() {
    this.loading = true;
    this.error = null;
    
    // Load attendance records for selected date
    const headers = this.getAuthHeaders();
    const params = {
      start_date: this.selectedDate,
      end_date: this.selectedDate
    };
    
    this.http.get<any>(`${environment.apiUrl}/attendance/report/`, { headers, params })
      .subscribe({
        next: (response) => {
          // Transform backend data to frontend format
          this.attendanceRecords = response.data || [];
          this.filterAttendance();
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.error('Error loading attendance:', err);
          this.error = 'Failed to load attendance records';
          
          // Fallback to mock data for development
          this.attendanceRecords = [
            {
              id: 1,
              studentName: 'John Doe',
              seatNumber: 15,
              checkInTime: new Date(`${this.selectedDate}T09:30:00`),
              checkOutTime: new Date(`${this.selectedDate}T17:00:00`),
              status: 'present',
            },
            {
              id: 2,
              studentName: 'Jane Smith',
              seatNumber: 8,
              checkInTime: new Date(`${this.selectedDate}T10:15:00`),
              status: 'present',
            },
            {
              id: 3,
              studentName: 'Bob Johnson',
              seatNumber: 22,
              checkInTime: new Date(`${this.selectedDate}T09:45:00`),
              status: 'pending',
            },
          ];
          this.filterAttendance();
        }
      });
  }

  createSession() {
    if (!this.selectedSession?.title) {
      alert('Please enter session title');
      return;
    }

    this.qrLoading = true;
    const headers = this.getAuthHeaders();
    
    const sessionData = {
      title: this.selectedSession.title,
      description: this.selectedSession.description || '',
      session_type: 'study',
      start_time: `${this.selectedDate}T09:00:00`,
      end_time: `${this.selectedDate}T18:00:00`,
      is_mandatory: false
    };
    
    this.http.post<AttendanceSession>(`${environment.apiUrl}/attendance/sessions/`, sessionData, { headers })
      .subscribe({
        next: (session) => {
          this.qrLoading = false;
          this.selectedSession = session;
          this.generateQRCode();
        },
        error: (err) => {
          this.qrLoading = false;
          console.error('Error creating session:', err);
          this.error = 'Failed to create attendance session';
        }
      });
  }

  generateQRCode() {
    this.qrLoading = true;
    this.error = null;
    
    const headers = this.getAuthHeaders();
    
    // Create or get session for today's date
    const sessionData = {
      title: `Attendance - ${this.selectedDate}`,
      description: `Daily attendance session for ${this.selectedDate}`,
      session_type: 'study',
      start_time: `${this.selectedDate}T09:00:00`,
      end_time: `${this.selectedDate}T18:00:00`,
      is_mandatory: false
    };
    
    // First create or get session, then generate QR code
    this.http.post<AttendanceSession>(`${environment.apiUrl}/attendance/sessions/`, sessionData, { headers })
      .subscribe({
        next: (session) => {
          // Session created/retrieved, now generate QR code
          this.http.post<AttendanceSession>(`${environment.apiUrl}/attendance/sessions/${session.id}/generate-qr/`, {}, { headers })
            .subscribe({
              next: (qrSession) => {
                this.qrCodeData = {
                  qr_token: qrSession.qr_code_token || this.generateToken(),
                  session_id: qrSession.id || session.id || 0,
                  date: this.selectedDate,
                  created: true,
                  qr_data: {
                    type: 'attendance',
                    date: this.selectedDate,
                    token: qrSession.qr_code_token || this.generateToken(),
                    session_id: qrSession.id || session.id || 0,
                    generated_by: this.authService.getCurrentUser()?.username || 'admin'
                  }
                };
                this.qrLoading = false;
                
                // Generate QR code image
                this.generateQRImage();
                
                // Load attendance data for the selected date
                this.loadAttendance();
                
                console.log('QR Code generated successfully for date:', this.selectedDate);
              },
              error: (qrErr) => {
                console.error('Error generating QR code:', qrErr);
                // Still create QR data even if QR generation fails
                this.qrCodeData = {
                  qr_token: this.generateToken(),
                  session_id: session.id || 0,
                  date: this.selectedDate,
                  created: true,
                  qr_data: {
                    type: 'attendance',
                    date: this.selectedDate,
                    token: this.generateToken(),
                    session_id: session.id || 0,
                    generated_by: this.authService.getCurrentUser()?.username || 'admin'
                  }
                };
                this.qrLoading = false;
                this.generateQRImage();
              }
            });
        },
        error: (err) => {
          this.qrLoading = false;
          console.error('Error creating session:', err);
          
          // Create fallback QR data
          this.qrCodeData = {
            qr_token: this.generateToken(),
            session_id: Math.floor(Math.random() * 1000),
            date: this.selectedDate,
            created: true,
            qr_data: {
              type: 'attendance',
              date: this.selectedDate,
              token: this.generateToken(),
              session_id: Math.floor(Math.random() * 1000),
              generated_by: this.authService.getCurrentUser()?.username || 'admin'
            }
          };
          this.qrLoading = false;
          this.generateQRImage();
          
          console.log('QR Code generated with fallback for date:', this.selectedDate);
        }
      });
  }

  displayQRCode(qrData: string) {
    // Display QR code image from backend
    setTimeout(() => {
      const qrContainer = document.getElementById('qrcode');
      if (qrContainer && qrData) {
        qrContainer.innerHTML = `
          <img src="${qrData}" alt="QR Code" style="max-width: 100%; height: auto;" />
          <div class="mt-3">
            <small class="text-muted">QR Token: ${this.qrCodeData?.qr_token?.substring(0, 20)}...</small>
          </div>
        `;
      }
    }, 100);
  }

  filterAttendance() {
    if (this.statusFilter === 'all') {
      this.filteredAttendance = [...this.attendanceRecords];
    } else {
      this.filteredAttendance = this.attendanceRecords.filter(
        (record) => record.status === this.statusFilter
      );
    }
  }

  approveAttendance(record: AttendanceRecord) {
    record.status = 'present';
    // TODO: Update backend
    this.filterAttendance();
  }

  rejectAttendance(record: AttendanceRecord) {
    record.status = 'absent';
    // TODO: Update backend
    this.filterAttendance();
  }

  getStats(status: string): number {
    return this.attendanceRecords.filter((record) => record.status === status)
      .length;
  }

  clearQRCode() {
    this.qrCodeData = null;
    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) {
      qrContainer.innerHTML = '';
    }
  }

  copyQRToken() {
    if (this.qrCodeData) {
      navigator.clipboard.writeText(this.qrCodeData.qr_token).then(() => {
        alert('QR Token copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy QR token');
      });
    }
  }

  downloadQRCode(): void {
    if (!this.qrCodeData) return;
    
    // Create QR code data string
    const qrDataString = JSON.stringify({
      type: this.qrCodeData?.qr_data?.type || 'attendance',
      date: this.qrCodeData?.qr_data?.date || this.selectedDate,
      token: this.qrCodeData?.qr_data?.token || this.qrCodeData?.qr_token || '',
      session_id: this.qrCodeData?.qr_data?.session_id || this.qrCodeData?.session_id || 0,
      generated_by: this.qrCodeData?.qr_data?.generated_by || 'admin'
    });
    
    // Generate high resolution QR code URL
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDataString)}`;
    
    // Open in new window for download
    window.open(qrImageUrl, '_blank');
  }

  // Generate a random token for QR code
  private generateToken(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  // Generate QR code image using online service
  private generateQRImage(): void {
    if (!this.qrCodeData) return;
    
    setTimeout(() => {
      const qrContainer = document.getElementById('qrcode');
      if (qrContainer) {
        // Create QR code data string
        const qrDataString = JSON.stringify({
          type: this.qrCodeData?.qr_data?.type || 'attendance',
          date: this.qrCodeData?.qr_data?.date || this.selectedDate,
          token: this.qrCodeData?.qr_data?.token || this.qrCodeData?.qr_token || '',
          session_id: this.qrCodeData?.qr_data?.session_id || this.qrCodeData?.session_id || 0,
          generated_by: this.qrCodeData?.qr_data?.generated_by || 'admin'
        });
        
        // Generate QR code using QR Server API
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrDataString)}`;
        
        qrContainer.innerHTML = `
          <div class="qr-code-wrapper">
            <img src="${qrImageUrl}" alt="QR Code" class="img-fluid border rounded shadow-sm" />
            <div class="mt-3">
              <small class="text-muted">QR Token: ${(this.qrCodeData?.qr_token || '').substring(0, 20)}...</small>
            </div>
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-primary" onclick="window.open('${qrImageUrl}', '_blank')">
                <i class="bi bi-download"></i> Download QR
              </button>
            </div>
          </div>
        `;
      }
    }, 100);
  }
}
