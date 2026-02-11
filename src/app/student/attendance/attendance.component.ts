import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AttendanceService,
  AttendanceSession,
  AttendanceRecord,
  QRScanResult,
  AttendanceScanResult,
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
  scannerOpen = false;
  cameraScannerOpen = false;
  fileUploadOpen = false;
  scanResult: QRScanResult | null = null;
  attendanceResult: AttendanceScanResult | null = null;
  selectedFile: File | null = null;
  cameraStream: MediaStream | null = null;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadActiveSessions();
    this.loadMyAttendance();
  }

  loadActiveSessions() {
    this.loading = true;
    this.attendanceService.getActiveSessions().subscribe({
      next: (sessions) => {
        this.activeSessions = sessions;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading sessions:', err);
      }
    });
  }

  loadMyAttendance() {
    this.loading = true;
    this.attendanceService.getMyAttendance().subscribe({
      next: (records) => {
        this.myAttendance = records;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading attendance:', err);
      }
    });
  }

  openScanner() {
    this.scannerOpen = true;
    this.scanResult = null;
    this.attendanceResult = null;
  }

  openCameraScanner() {
    this.cameraScannerOpen = true;
    this.scanResult = null;
    this.attendanceResult = null;
    this.cameraStream = null;
  }

  closeCameraScanner() {
    this.stopCamera();
    this.cameraScannerOpen = false;
    this.scanResult = null;
    this.attendanceResult = null;
  }

  openFileUpload() {
    this.fileUploadOpen = true;
    this.scanResult = null;
    this.attendanceResult = null;
    this.selectedFile = null;
  }

  closeFileUpload() {
    this.fileUploadOpen = false;
    this.scanResult = null;
    this.attendanceResult = null;
    this.selectedFile = null;
  }

  closeScanner() {
    this.scannerOpen = false;
    this.scanResult = null;
    this.attendanceResult = null;
    this.selectedFile = null;
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.scanQRFromFile();
    }
  }

  scanQRFromFile() {
    if (!this.selectedFile) {
      alert('कृपया QR कोड वाली छवि चुनें');
      return;
    }

    this.loading = true;
    this.attendanceService.scanQRFromImage(this.selectedFile).subscribe({
      next: (result: QRScanResult) => {
        this.loading = false;
        this.scanResult = result;
        
        if (result.success && result.qr_data) {
          // Process the QR code for attendance
          this.processQRScan(result.qr_data);
        } else {
          alert(`❌ QR कोड स्कैन करने में विफल: ${result.error || 'अज्ञात त्रुटि'}`);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('QR scan error:', err);
        alert(`❌ स्कैनिंग त्रुटि: ${err.error?.error || 'सर्वर त्रुटि'}`);
      }
    });
  }

  processQRScan(qrData: string) {
    this.loading = true;
    
    // Get device info and location
    const deviceInfo = this.attendanceService.getDeviceInfo();
    
    this.attendanceService.getCurrentLocation().then(location => {
      this.attendanceService.processAttendanceScan(qrData, location, deviceInfo).subscribe({
        next: (result: AttendanceScanResult) => {
          this.loading = false;
          this.attendanceResult = result;
          
          if (result.success) {
            this.attendanceStatus = 'marked';
            alert(`✅ ${result.message || 'उपस्थिति सफलतापूर्वक दर्ज की गई!'}`);
            this.loadMyAttendance(); // Refresh attendance list
            this.closeScanner();
          } else {
            alert(`❌ उपस्थिति दर्ज करने में विफल: ${result.error || 'अज्ञात त्रुटि'}`);
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Attendance processing error:', err);
          const errorMsg = err.error?.error || 'प्रोसेसिंग त्रुटि';
          alert(`❌ त्रुटि: ${errorMsg}`);
        }
      });
    });
  }

  scanQRCode() {
    if (!this.qrCodeInput.trim()) {
      alert('कृपया QR कोड टोकन दर्ज करें');
      return;
    }

    this.processQRScan(this.qrCodeInput.trim());
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

  // Camera Scanner Methods
  async startCamera(): Promise<void> {
    try {
      this.loading = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      this.cameraStream = stream;
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = stream;
      }
      this.loading = false;
    } catch (error) {
      this.loading = false;
      console.error('Camera access error:', error);
      alert('❌ Camera access denied. Please allow camera permissions and try again.');
    }
  }

  stopCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    if (this.videoElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  captureAndScan(): void {
    if (!this.videoElement || !this.canvasElement) {
      alert('❌ Camera not ready');
      return;
    }

    this.loading = true;
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    
    if (!context) {
      this.loading = false;
      alert('❌ Canvas context not available');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob and scan
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        this.selectedFile = file;
        this.scanQRFromFile();
      } else {
        this.loading = false;
        alert('❌ Failed to capture image');
      }
    }, 'image/jpeg', 0.8);
  }
}
