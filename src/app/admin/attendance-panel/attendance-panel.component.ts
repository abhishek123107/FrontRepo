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
  loading = false;
  error: string | null = null;
  qrLoading = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadAttendance();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  loadAttendance() {
    this.loading = true;
    this.error = null;
    
    // For now, using mock data. In production, fetch from backend
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
    this.loading = false;
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

  generateQRCode() {
    this.qrLoading = true;
    this.error = null;
    
    const headers = this.getAuthHeaders();
    
    this.http.post<QRCodeData>(`${environment.apiUrl}/attendance/generate-qr/`, {}, { headers })
      .subscribe({
        next: (response) => {
          this.qrCodeData = response;
          this.qrLoading = false;
          this.generateQRImage(response.qr_token);
          console.log('QR Code generated successfully:', response);
        },
        error: (err) => {
          this.qrLoading = false;
          console.error('Error generating QR code:', err);
          
          if (err.status === 401) {
            this.error = 'Authentication required. Please login again.';
          } else if (err.status === 403) {
            this.error = 'Admin access required to generate QR codes.';
          } else if (err.status === 0) {
            this.error = 'Unable to connect to server. Please check if the backend is running.';
          } else {
            this.error = 'Failed to generate QR code. Please try again.';
          }
        }
      });
  }

  generateQRImage(qrToken: string) {
    // Generate a simple QR code representation
    // In production, use a proper QR code library like qrcode.js
    setTimeout(() => {
      const qrContainer = document.getElementById('qrcode');
      if (qrContainer) {
        // Create a simple QR code visual representation
        const qrContent = qrToken;
        const qrSize = Math.min(200, Math.max(150, qrContent.length * 2));
        
        qrContainer.innerHTML = `
          <div style="
            width: ${qrSize}px; 
            height: ${qrSize}px; 
            background: white; 
            border: 3px solid #000; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            position: relative;
            font-family: monospace;
            font-size: 8px;
            padding: 10px;
            box-sizing: border-box;
          ">
            <div style="
              width: 100%; 
              height: 100%; 
              background: repeating-linear-gradient(
                0deg,
                #000,
                #000 2px,
                #fff 2px,
                #fff 4px
              ),
              repeating-linear-gradient(
                90deg,
                #000,
                #000 2px,
                #fff 2px,
                #fff 4px
              );
              opacity: 0.3;
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              text-align: center;
              font-weight: bold;
              color: #000;
              background: white;
              padding: 5px;
              border: 2px solid #000;
              border-radius: 4px;
            ">
              ATTENDANCE<br>
              ${this.selectedDate}
            </div>
          </div>
          <div class="mt-3">
            <small class="text-muted">QR Token: ${qrToken.substring(0, 20)}...</small>
          </div>
        `;
      }
    }, 100);
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
}
