import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Seat } from '../../models/seat.model';
import {
  SeatBooking,
  SeatBookingService,
} from '../../services/seat-booking.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-seat-booking',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './seat-booking.component.html',
  styleUrl: './seat-booking.component.css',
})
export class SeatBookingComponent implements OnInit {
  seats: Seat[] = [];
  selectedSeat: Seat | null = null;

  paymentStep = 1; // 1=form, 2=payment
  loading = false;
  selectedFile: File | null = null;

  showOfflineMessage = false;
  showPayButton = false;
  paymentFailed = false;
  paymentErrorMessage = '';

  pendingBooking: SeatBooking | null = null;
  loadingSeats = true;
  fileErrorMessage = '';

  adminDetails = {
    accountName: 'Library Admin',
    accountNumber: '1234567890',
    ifsc: 'SBIN0001234',
    qrCode:
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=UPI%20Payment%20for%20Library%20Seat%20Booking',
  };

  constructor(
    private router: Router,
    private seatBookingService: SeatBookingService,
    private authService: AuthService
  ) {
    // Don't initialize mock seats immediately - wait for backend data
    console.log('Component initialized, waiting for authentication and backend data...');
  }

  ngOnInit() {
    // Wait for authentication to be ready before loading seats from backend
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        console.log('User authenticated, loading seats from backend');
        this.loadSeats();
      } else {
        console.log('User not authenticated, keeping mock seats');
        this.loadingSeats = false;
      }
    });
  }

  loadSeats() {
    this.loadingSeats = true;
    console.log('Starting to load seats...');

    this.seatBookingService.getSeats().subscribe({
      next: (seats) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e63252b9-4d6f-4a01-ba28-3ad21c918bd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'seat-booking.component.ts:73',message:'getSeats success',data:{seatsType:typeof seats,isArray:Array.isArray(seats),length:seats?.length,firstSeat:seats?.[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.log('Raw seats from backend:', seats);
        console.log('Seats array length:', seats.length);

        if (seats && seats.length > 0) {
          // Backend returned seats, use them
          this.seats = seats.map((seat) => ({ ...seat, selected: false }));
          console.log('Using backend seats:', this.seats.length);
        } else {
          // Backend returned empty array, initialize mock seats
          console.log('Backend returned empty seats, initializing mock seats');
          this.initializeMockSeats();
        }

        this.loadingSeats = false;
        console.log('Loading completed, seats available:', this.seats.length);
      },
      error: (error) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e63252b9-4d6f-4a01-ba28-3ad21c918bd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'seat-booking.component.ts:90',message:'getSeats error',data:{status:error?.status,statusText:error?.statusText,url:error?.url,message:error?.message,errorDetails:error?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('Backend error details:', error);

        // Check if it's an authentication error
        if (error.status === 401) {
          console.warn('Authentication required for seat booking');
          alert('Please log in to view and book seats.');
          this.router.navigate(['/login']);
          return;
        }

        console.log('Backend failed, using mock seats for demo');
        this.initializeMockSeats();
        this.loadingSeats = false;
      },
    });
  }

  initializeMockSeats() {
    // Create seats with different statuses for demonstration
    const statuses: ('available' | 'booked' | 'maintenance')[] = [
      'available',
      'booked',
      'maintenance',
    ];

    for (let i = 1; i <= 30; i++) {
      // Distribute statuses: mostly available, some booked, few maintenance
      let status: 'available' | 'booked' | 'maintenance' = 'available';
      if (i % 7 === 0) status = 'booked'; // Every 7th seat booked
      if (i % 13 === 0) status = 'maintenance'; // Every 13th seat maintenance

      this.seats.push({
        id: i,
        number: i,
        status: status,
        selected: false,
        photo: `https://picsum.photos/400/300?random=${i}`, // More reliable placeholder URL
      });
    }
    console.log('Mock seats created with variety:', this.seats);
  }

  selectSeat(seat: Seat) {
    // Only allow selection of available seats
    if (seat.status !== 'available') {
      console.warn(`Seat ${seat.number} is not available for booking (status: ${seat.status})`);
      alert(`Seat ${seat.number} is not available for booking. Please select an available seat.`);
      return;
    }
    
    if (this.selectedSeat) this.selectedSeat.selected = false;
    seat.selected = true;
    this.selectedSeat = seat;
    console.log(`Selected available seat ${seat.number} (ID: ${seat.id})`);
  }

  // TrackBy function for better performance with ngFor
  trackBySeatId(index: number, seat: Seat): number {
    return seat.id;
  }

  /** BOOK SEAT */
  onBookSeat(form: NgForm) {
    if (!form.valid || !this.selectedSeat) return;

    // Double-check seat availability before booking
    if (this.selectedSeat.status !== 'available') {
      alert(`Seat ${this.selectedSeat.number} is no longer available. Please select a different seat.`);
      return;
    }

    console.log(`Attempting to book seat ${this.selectedSeat.number} (ID: ${this.selectedSeat.id})`);

    // Convert timing to start_time and end_time
    const timeSlots = this.getTimeSlots(form.value.timing);

    const booking: SeatBooking = {
      seat: this.selectedSeat.id,
      start_time: timeSlots.start_time,
      end_time: timeSlots.end_time,
      purpose: form.value.purpose, // Backend expects 'purpose'
      payment_method: form.value.payment,
    };

    // 🔹 OFFLINE FLOW
    if (booking.payment_method === 'offline') {
      this.seatBookingService.bookSeat(booking).subscribe({
        next: () => {
          this.showOfflineMessage = true;
          alert('Booking request sent. Please contact library office.');
        },
        error: (error) => {
          if (error.status === 401) {
            alert('Please log in to book seats.');
            this.router.navigate(['/login']);
          } else {
            alert('Booking failed. Please try again.');
          }
        },
      });
      return;
    }

    // 🔹 ONLINE FLOW
    this.pendingBooking = booking;
    this.paymentStep = 2;
    this.showPayButton = true;
  }

  /** Convert timing option to start_time and end_time */
  private getTimeSlots(timing: string): {
    start_time: string;
    end_time: string;
  } {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    // Determine start and end times based on timing option
    let startHour = '09:00:00';
    let endHour = '18:00:00';
    
    switch (timing) {
      case 'morning':
        startHour = '09:00:00';
        endHour = '13:00:00';
        break;
      case 'evening':
        startHour = '14:00:00';
        endHour = '18:00:00';
        break;
      case 'full-day':
        startHour = '09:00:00';
        endHour = '18:00:00';
        break;
      default:
        startHour = '09:00:00';
        endHour = '18:00:00';
    }
    
    // Create start_time for today
    const todayStartTime = new Date(`${today}T${startHour}Z`);
    
    // Add a 5-minute buffer to ensure booking is definitely in the future
    // This accounts for timezone differences and ensures backend validation passes
    const bufferMinutes = 5;
    const bufferTime = new Date(todayStartTime.getTime() + bufferMinutes * 60 * 1000);
    
    // Check if the start time (with buffer) has already passed today
    // If yes, use tomorrow's date; otherwise use today
    let bookingDate = today;
    if (bufferTime <= now) {
      // Time slot has passed (or is too close), use tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      bookingDate = tomorrow.toISOString().split('T')[0];
    }
    
    return {
      start_time: `${bookingDate}T${startHour}Z`,
      end_time: `${bookingDate}T${endHour}Z`,
    };
  }

  onFileSelected(event: Event | any) {
    const target = (event?.target || event) as HTMLInputElement;
    const file = target?.files?.[0];

    // Reset payment failure state when new file is selected
    if (this.paymentFailed) {
      this.paymentFailed = false;
      this.paymentErrorMessage = '';
    }
    this.fileErrorMessage = '';

    // Validate file
    if (!file) {
      this.selectedFile = null;
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.fileErrorMessage = 'Please select a valid image file (JPEG, PNG, GIF, or WebP).';
      this.selectedFile = null;
      event.target.value = ''; // Clear the input
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      this.fileErrorMessage = 'File size must be less than 5MB. Please choose a smaller image.';
      this.selectedFile = null;
      event.target.value = ''; // Clear the input
      return;
    }

    this.selectedFile = file;
  }

  /** FINAL PAY & BOOK */
  payAndBookSeat() {
    // Comprehensive validation before processing
    if (!this.pendingBooking) {
      this.paymentFailed = true;
      this.paymentErrorMessage = 'Booking details are missing. Please start over.';
      return;
    }

    if (!this.selectedFile) {
      this.paymentFailed = true;
      this.paymentErrorMessage = 'Please select a payment screenshot before proceeding.';
      return;
    }

    // Additional file validation (in case validation was bypassed)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(this.selectedFile.type)) {
      this.paymentFailed = true;
      this.paymentErrorMessage = 'Invalid file type. Please select a valid image file.';
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (this.selectedFile.size > maxSize) {
      this.paymentFailed = true;
      this.paymentErrorMessage = 'File size is too large. Please choose an image smaller than 5MB.';
      return;
    }

    this.loading = true;
    this.paymentFailed = false;
    this.paymentErrorMessage = '';

    const formData = new FormData();
    formData.append('seat', String(this.pendingBooking.seat));
    formData.append('start_time', this.pendingBooking.start_time);
    formData.append('end_time', this.pendingBooking.end_time);
    formData.append('purpose', this.pendingBooking.purpose); // Backend expects 'purpose'
    formData.append('payment_screenshot', this.selectedFile); // Payment screenshot for online payment
    // #region agent log
    const formDataEntries: any = {};
    // Iterate over FormData entries - using type assertion for TypeScript compatibility
    const formDataAny = formData as any;
    if (formDataAny.entries) {
      try {
        const entries = formDataAny.entries() as Iterable<[string, FormDataEntryValue]>;
        const entriesArray = Array.from(entries) as [string, FormDataEntryValue][];
        for (const [key, value] of entriesArray) {
          formDataEntries[key] = value instanceof File ? `[File: ${value.name}, ${value.size} bytes]` : String(value);
        }
      } catch (e) {
        // Fallback: manually log known keys
        formDataEntries['seat'] = String(this.pendingBooking.seat);
        formDataEntries['start_time'] = this.pendingBooking.start_time;
        formDataEntries['end_time'] = this.pendingBooking.end_time;
        formDataEntries['purpose'] = this.pendingBooking.purpose;
        formDataEntries['payment_screenshot'] = this.selectedFile ? `[File: ${this.selectedFile.name}, ${this.selectedFile.size} bytes]` : 'none';
      }
    } else {
      // Fallback: manually log known keys if entries() is not available
      formDataEntries['seat'] = String(this.pendingBooking.seat);
      formDataEntries['start_time'] = this.pendingBooking.start_time;
      formDataEntries['end_time'] = this.pendingBooking.end_time;
      formDataEntries['purpose'] = this.pendingBooking.purpose;
      formDataEntries['payment_screenshot'] = this.selectedFile ? `[File: ${this.selectedFile.name}, ${this.selectedFile.size} bytes]` : 'none';
    }
    fetch('http://127.0.0.1:7242/ingest/e63252b9-4d6f-4a01-ba28-3ad21c918bd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'seat-booking.component.ts:291',message:'payAndBookSeat FormData created',data:{pendingBooking:this.pendingBooking,formDataKeys:Object.keys(formDataEntries),formDataEntries},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    console.log('Sending booking request with form data...');

    this.seatBookingService.bookSeatWithPayment(formData).subscribe({
      next: (response) => {
        console.log('Booking successful:', response);
        this.loading = false;
        this.paymentFailed = false;
        alert('Payment successful & seat booked successfully.');
        this.router.navigate(['/student/dashboard']);
      },
      error: (error) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e63252b9-4d6f-4a01-ba28-3ad21c918bd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'seat-booking.component.ts:304',message:'bookSeatWithPayment error',data:{status:error?.status,statusText:error?.statusText,url:error?.url,message:error?.message,errorDetails:error?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('Booking failed:', error);
        this.loading = false;
        this.paymentFailed = true;

        // Enhanced error handling with more specific messages
        if (error.status === 401) {
          this.paymentErrorMessage =
            'Authentication failed. Please log in again.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else if (error.status === 400) {
          // Handle different types of validation errors
          const errorDetail = error.error?.detail || error.error?.message || '';
          if (errorDetail.toLowerCase().includes('screenshot')) {
            this.paymentErrorMessage = 'Payment screenshot validation failed. Please ensure the image is clear and shows complete transaction details.';
          } else if (errorDetail.toLowerCase().includes('seat')) {
            this.paymentErrorMessage = 'Selected seat is not available. Please choose another seat.';
          } else if (errorDetail.toLowerCase().includes('time')) {
            this.paymentErrorMessage = 'Invalid timing selection. Please check your booking times.';
          } else {
            this.paymentErrorMessage = errorDetail || 'Invalid booking details. Please check your information and try again.';
          }
        } else if (error.status === 409) {
          this.paymentErrorMessage =
            'Seat is no longer available or time slot is already booked. Please select another seat or time.';
        } else if (error.status === 413) {
          this.paymentErrorMessage = 'File is too large. Please choose a smaller image (max 5MB).';
        } else if (error.status === 415) {
          this.paymentErrorMessage = 'Unsupported file type. Please upload a valid image file.';
        } else if (error.status >= 500) {
          this.paymentErrorMessage = 'Server error occurred. Please try again in a few moments.';
        } else {
          this.paymentErrorMessage =
            error.error?.message ||
            error.message ||
            'Payment processing failed. Please check your internet connection and try again.';
        }
      },
    });
  }

  /** RETRY PAYMENT */
  retryPayment() {
    this.payAndBookSeat();
  }

  /** RESET PAYMENT STATE */
  resetPaymentState() {
    this.paymentFailed = false;
    this.paymentErrorMessage = '';
    this.selectedFile = null;
    // Clear file input
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /** SIMULATE PAYMENT FAILURE (FOR TESTING) */
  simulatePaymentFailure() {
    this.loading = false;
    this.paymentFailed = true;
    this.paymentErrorMessage =
      'Payment verification failed. Please ensure your payment screenshot is clear and shows the complete transaction details.';
  }
}
