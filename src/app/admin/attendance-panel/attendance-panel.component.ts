import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

interface AttendanceRecord {
  id: number;
  studentName: string;
  seatNumber: number;
  checkInTime: Date;
  checkOutTime?: Date;
  status: 'present' | 'absent' | 'pending';
}

@Component({
  selector: 'app-attendance-panel',
  standalone: true,
  imports: [FormsModule, CommonModule, DatePipe,RouterOutlet],
  templateUrl: './attendance-panel.component.html',
  styleUrl: './attendance-panel.component.css',
})
export class AttendancePanelComponent implements OnInit {
  selectedDate: string = new Date().toISOString().split('T')[0];
  statusFilter: string = 'all';
  qrCodeData: string = '';
  attendanceRecords: AttendanceRecord[] = [];
  filteredAttendance: AttendanceRecord[] = [];

  ngOnInit() {
    this.loadAttendance();
  }

  loadAttendance() {
    // Mock data - in real app, fetch from backend based on selectedDate
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
    // Generate QR code for today's attendance
    this.qrCodeData = `ATTENDANCE_${this.selectedDate}_${Date.now()}`;

    // In real app, use a QR code library to generate visual QR code
    setTimeout(() => {
      // Mock QR code generation
      const qrContainer = document.getElementById('qrcode');
      if (qrContainer) {
        qrContainer.innerHTML =
          '<div style="width: 200px; height: 200px; background: #f0f0f0; border: 2px solid #000; display: flex; align-items: center; justify-content: center;"><span>QR CODE</span></div>';
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
}
