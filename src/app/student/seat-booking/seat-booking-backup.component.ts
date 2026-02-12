import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Seat } from '../../models/seat.model';
import {
  SeatBooking,
  SeatBookingService,
} from '../../services/seat-booking.service';
import { AuthService } from '../../services/auth.service';
import { ErrorHandler } from '../../utils/error-handler';

export interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  available_seats: number;
  created_at?: string;
}

@Component({
  selector: 'app-seat-booking',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './seat-booking.component.html',
  styleUrls: ['./seat-booking.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeatBookingComponent implements OnInit {
  seats: Seat[] = [];
  selectedSeat: Seat | null = null;
  timeSlots: TimeSlot[] = [];
  showTimeSlotModalFlag = false;
  selectedTimeSlot: TimeSlot | null = null;
  timeSlotForm: NgForm = new NgForm([], []);
  loading = false;
  error: string | null = null;
  isf: string = 'SBIN0001234';
  qrCode: string = 
    'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=UPI%20Payment%20for%20Library%20Seat%20Booking';
  qrData: string = '';
  bookingForm: NgForm = new NgForm([], []);
  selectedTimeSlotId: number | null = null;
  loadingSeats = false;
  loadingBookings = false;
  bookings: SeatBooking[] = [];
  filteredBookings: SeatBooking[] = [];
  statusFilter: string = 'all';
  dateFilter: string = '';
  userFilter: string = '';

  // Timing sections for seat mapping
  timingSections = [
    { id: 'morning', name: 'Morning Shift', time: '06:00:00 - 11:00:00', price: '₹300' },
    { id: 'afternoon', name: 'Afternoon Shift', time: '11:00:00 - 16:00:00', price: '₹350' },
    { id: 'evening', name: 'Evening Shift', time: '16:00:00 - 21:00:00', price: '₹300' },
    { id: 'full-day', name: 'Full Day', time: '06:00:00 - 18:00:00', price: '₹500' },
    { id: 'night', name: 'Night Shift', time: '19:00:00 - 06:00:00', price: '₹350' },
    { id: '24-7', name: '24/7 Access', time: '00:00:00 - 23:59:59', price: '₹800' }
  ];

  // Cache for timing section names
  private _timingSectionCache = new Map<string, string>();
  private _lastSelectedTimingSection: string | null = null;

  // Payment and booking state
  paymentStep = 1;
  showPayButton = false;
  pendingBooking: any = null;
  showOfflineMessage = false;
  fileErrorMessage: string = '';
  paymentFailed = false;
  paymentErrorMessage = string = '';

  // Form model for auto-selection
  bookingFormData = {
    timing: '',
    purpose: ''
  };

  constructor(
    private router: Router,
    private seatBookingService: SeatBookingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize forms
    this.timeSlotForm = new NgForm([], []);
    this.bookingForm = new NgForm([], []);
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
        // Trigger change detection for OnPush strategy
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading seats:', error);
        this.error = 'Failed to load seats. Please try again.';
        this.loadingSeats = false;
      }
    });
  }

  // Initialize mock seats for development
  private initializeMockSeats() {
    this.seats = [
      { id: 1, seat_number: 'A1', status: 'available' },
      { id: 2, seat_number: 'A2', status: 'available' },
      { id: 3, seat_number: 'A3', status: 'available' },
      // Add more seats as needed
    ];
  }

  get selectedTimingSectionName(): string {
    if (this._lastSelectedTimingSection === this.selectedTimingSection && this._timingSectionCache.has(this.selectedTimingSection)) {
      return this._timingSectionCache.get(this.selectedTimingSection)!;
    }
    
    // Find and cache the section name
    const sectionName = this.timingSections.find(section => section.id === this.selectedTimingSection)?.name || '';
    this._timingSectionCache.set(this.selectedTimingSection, sectionName);
    this._lastSelectedTimingSection = this.selectedTimingSection;
    
    return sectionName;
  }

  // Get seats for selected timing section
  getSeatsForCurrentTiming(): Seat[] {
    // For demo purposes, we'll show different seat availability based on timing
    const timingSeatMap: { [key: string]: number[] } = {
      'morning': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      'afternoon': [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
      'evening': [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51],
      'night': [52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68],
      'full-day': [69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84],
      '24-7': [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100]
    };

    const seatIdsForTiming = timingSeatMap[this.selectedTimingSection] || [];
    return this.seats.filter(seat => seatIdsForTiming.includes(seat.id));
  }

  // Track by seat ID for better performance
  trackBySeatId(index: number, seat: Seat): number {
    return seat.id;
  }

  selectSeat(seat: Seat) {
    // Only allow selection of available seats
    if (seat.status !== 'available') {
      console.warn(`Seat ${seat.seat_number} is not available for booking (status: ${seat.status})`);
      alert(`Seat ${seat.seat_number} is not available for booking. Please select an available seat.`);
      return;
    }
    
    if (this.selectedSeat) this.selectedSeat.selected = false;
    seat.selected = true;
    this.selectedSeat = seat;
    
    // Auto-select timing slot and membership plan based on selected seat
    this.autoSelectTimingAndMembership();
    
    console.log(`Selected available seat ${seat.seat_number} (ID: ${seat.id}) for ${this.selectedTimingSection} shift`);
    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  // Select timing section
  selectTimingSection(sectionId: string) {
    this.selectedTimingSection = sectionId;
    // Clear selected seat when changing timing section
    if (this.selectedSeat) {
      this.selectedSeat.selected = false;
      this.selectedSeat = null;
    }
    console.log(`Selected timing section: ${sectionId}`);
    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  // Auto-select timing slot and membership plan based on selected seat
  private autoSelectTimingAndMembership(): void {
    // Get seats for current timing to determine which timing section this seat belongs to
    const timingSeatMap: { [key: string]: number[] } = {
      'morning': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      'afternoon': [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
      'evening': [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51],
      'night': [52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68],
      'full-day': [69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84],
      '24-7': [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100]
    };

    // Find which timing section this seat belongs to
    let detectedTimingSection = '';
    for (const [timing, seatIds] of Object.entries(timingSeatMap)) {
      if (seatIds.includes(this.selectedSeat!.id)) {
        detectedTimingSection = timing;
        break;
      }
    }

    // Update timing section if different
    if (detectedTimingSection && detectedTimingSection !== this.selectedTimingSection) {
      this.selectedTimingSection = detectedTimingSection;
      console.log(`Auto-selected timing section: ${detectedTimingSection}`);
    }

    // Auto-select membership plan to match timing section
    this.autoSelectMembershipPlan(detectedTimingSection);
  }

  // Auto-select membership plan based on timing section
  private autoSelectMembershipPlan(timingSection: string): void {
    // Update form model for auto-selection
    this.bookingFormData.timing = timingSection;
    this.bookingFormData.purpose = timingSection;
    
    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  // BOOK SEAT */
  onBookSeat(form: NgForm) {
    if (!form.valid || !this.selectedSeat) {
      console.log('Form invalid or no seat selected:', { valid: form.valid, selectedSeat: this.selectedSeat });
      return;
    }

    // Double-check seat availability before booking
    if (this.selectedSeat.status !== 'available') {
      const seatNum = this.selectedSeat.seat_number || `Seat ID ${this.selectedSeat.id}`;
      alert(`${seatNum} is no longer available. Please select a different seat.`);
      return;
    }

    const seatNum = this.selectedSeat.seat_number || `Seat ID ${this.selectedSeat.id}`;
    console.log(`Attempting to book seat ${seatNum} (ID: ${this.selectedSeat.id})`);

    // Convert timing to start_time and end_time
    const timeSlots = this.getTimeSlots(this.selectedTimingSection);

    const booking: any = {
      seat: this.selectedSeat.id,
      start_time: timeSlots.start_time,
      end_time: timeSlots.end_time,
      purpose: String(form.value.purpose || '').trim().replace(/['"]+/g, ''), // Clean any quotes and trim
      special_requests: '' // Add empty special_requests as it's expected by backend
    };

    // Debug: exact booking data being sent
    console.log('=== BOOKING DEBUG ===');
    console.log('Form value purpose:', JSON.stringify(form.value.purpose));
    console.log('Trimmed purpose:', JSON.stringify(booking.purpose));
    console.log('Purpose type:', typeof booking.purpose);
    console.log('Full booking object:', JSON.stringify(booking));
    console.log('=====================');

    // Add payment fields based on payment method
    if (form.value.payment === 'offline') {
      // Offline payment - no payment fields needed
      console.log('Creating offline booking:', booking);
      this.seatBookingService.bookSeat(booking).subscribe({
        next: (response) => {
          console.log('✅ Booking successful:', response);
          this.showOfflineMessage = true;
          alert('Booking request sent. Please contact library office.');
        },
        error: (error) => {
          console.error('❌ Booking failed:', error);
          console.error('Error status:', error.status);
          console.error('Error data:', error.error);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          
          if (error.status === 401) {
            alert('Please log in to book seats.');
            this.router.navigate(['/login']);
          } else {
            // Try to extract meaningful error message
            let errorMessage = 'Booking failed. Please try again.';
            
            if (error.error) {
              if (typeof error.error === 'string') {
                errorMessage = error.error;
              } else if (error.error.detail) {
                errorMessage = error.error.detail;
              } else if (error.error.purpose) {
                errorMessage = error.error.purpose[0];
              } else if (error.error.seat) {
                errorMessage = error.error.seat[0];
              }
            }
            
            const friendlyMessage = ErrorHandler.parseError(error);
            alert(`${friendlyMessage}\n\nDebug: ${errorMessage}`);
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
        startHour = '06:00:00';
        endHour = '11:00:00';
        break;
      case 'afternoon':
        startHour = '11:00:00';
        endHour = '16:00:00';
        break;
      case 'evening':
        startHour = '16:00:00';
        endHour = '21:00:00';
        break;
      case 'full-day':
        startHour = '06:00:00';
        endHour = '18:00:00';
        break;
      case 'night':
        startHour = '19:00:00';
        endHour = '06:00:00';
        break;
      case '24-7':
        startHour = '00:00:00';
        endHour = '23:59:59';
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
    
    // Check if start time (with buffer) has already passed today
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

  // File selection for payment screenshots
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
      return;
    }

    // Simple validation for demo purposes
    if (file.size > 5 * 1024 * 1024) { // 5MB
      this.fileErrorMessage = 'File size must be less than 5MB';
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.fileErrorMessage = 'Only JPEG, PNG, GIF, and WebP images are allowed';
      return;
    }

    this.fileErrorMessage = '';
    console.log('File selected:', file.name);
  }

  // Simulate payment failure for testing
  simulatePaymentFailure() {
    this.paymentFailed = true;
    this.paymentErrorMessage = 'Payment verification failed. Please try again.';
    this.showPayButton = false;
  }

  // Retry payment
  retryPayment() {
    this.paymentFailed = false;
    this.paymentErrorMessage = '';
    this.showPayButton = true;
  }

  // Reset payment state
  resetPaymentState() {
    this.paymentFailed = false;
    this.paymentErrorMessage = '';
    this.paymentStep = 1;
  }

  // Pay and book seat (for online payment)
  payAndBookSeat() {
    if (!this.selectedFile || this.loading) return;

    this.loading = true;
    const formData = new FormData();
    formData.append('seat', this.selectedSeat!.id.toString());
    formData.append('start_time', this.pendingBooking.start_time);
    formData.append('end_time', this.pendingBooking.end_time);
    formData.append('purpose', this.pendingBooking.purpose);
    formData.append('payment_screenshot', this.selectedFile);

    this.seatBookingService.bookSeatWithPayment(formData).subscribe({
      next: (response) => {
        this.loading = false;
        this.showOfflineMessage = true;
        alert('Booking confirmed! Payment screenshot uploaded.');
        this.resetPaymentState();
      },
      error: (error) => {
        this.loading = false;
        this.paymentFailed = true;
        this.paymentErrorMessage = ErrorHandler.parseError(error);
      }
    });
  }
}
