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
  fileErrorMessage: string = '';

  // Form model for auto-selection
  bookingFormData = {
    timing: '',
    purpose: ''
  };

  paymentStep = 1; // 1=form, 2=payment
  selectedFile: File | null = null;

  showOfflineMessage = false;
  showPayButton = false;
  paymentFailed = false;
  paymentErrorMessage = '';

  pendingBooking: SeatBooking | null = null;

  adminDetails = {
    accountName: 'Library Admin',
    accountNumber: '1234567890',
    ifsc: 'SBIN0001234',
    qrCode:
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=UPI%20Payment%20for%20Library%20Seat%20Booking',
  };

  // Time slot sections
  selectedTimingSection: string = 'morning';
  timingSections = [
    { id: 'morning', name: 'Morning Shift', time: '6 AM - 11 AM', price: '₹300/- महीना' },
    { id: 'afternoon', name: 'Afternoon Shift', time: '11 AM - 4 PM', price: '₹350/- महीना' },
    { id: 'evening', name: 'Evening Shift', time: '4 PM - 9 PM', price: '₹300/- महीना' },
    { id: 'night', name: 'Night Shift', time: '7 PM - 6 AM', price: '₹350/- महीना' },
    { id: 'full-day', name: 'Full Day', time: '12 Hours', price: '₹500/- महीना' },
    { id: '24-7', name: '24/7 Access', time: 'Unlimited', price: '₹800/- महीना' }
  ];

  // Cache for timing section lookup to optimize performance
  private _timingSectionCache = new Map<string, string>();
  private _lastSelectedTimingSection: string = '';

  /**
   * Optimized getter for the selected timing section name
   * Uses caching for better performance in large-scale applications
   */
  get selectedTimingSectionName(): string {
    // Return cached value if selection hasn't changed
    if (this._lastSelectedTimingSection === this.selectedTimingSection && 
        this._timingSectionCache.has(this.selectedTimingSection)) {
      return this._timingSectionCache.get(this.selectedTimingSection)!;
    }

    // Find and cache the section name
    const sectionName = this.timingSections.find(section => section.id === this.selectedTimingSection)?.name || '';
    this._timingSectionCache.set(this.selectedTimingSection, sectionName);
    this._lastSelectedTimingSection = this.selectedTimingSection;
    
    return sectionName;
  }

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
          // Debug first seat structure
          if (seats.length > 0) {
            console.log('First seat structure:', seats[0]);
            console.log('First seat fields:', Object.keys(seats[0]));
          }
          
          // Backend returned seats, use them
          this.seats = seats.map((seat, index) => {
            // Ensure seat_number exists, create fallback if missing
            const seatWithNumber = {
              ...seat,
              selected: false,
              seat_number: seat.seat_number || `S${seat.id || index + 1}`
            };
            console.log(`Processed seat ${seatWithNumber.id}:`, seatWithNumber);
            return seatWithNumber;
          });
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
        // Trigger change detection for OnPush strategy
        this.cdr.markForCheck();
      },
    });
  }

  initializeMockSeats() {
    // Create 100 seats with different statuses for demonstration
    const statuses: ('available' | 'occupied' | 'maintenance')[] = [
      'available',
      'occupied',
      'maintenance',
    ];

    for (let i = 1; i <= 100; i++) {
      // Distribute statuses: mostly available, some occupied, few maintenance
      let status: 'available' | 'occupied' | 'maintenance' = 'available';
      if (i % 8 === 0) status = 'occupied'; // Every 8th seat occupied
      if (i % 13 === 0) status = 'maintenance'; // Every 13th seat maintenance

      this.seats.push({
        id: i,
        seat_number: i.toString(),
        status: status,
        selected: false,
        photo: `https://picsum.photos/400/300?random=${i}`, // More reliable placeholder URL
      });
    }
    console.log('Mock seats created with 100 seats:', this.seats);
  }

  // TrackBy function for better performance with ngFor
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

  // Clear seat selection
  clearSeatSelection() {
    if (this.selectedSeat) {
      this.selectedSeat.selected = false;
      console.log(`Cleared selection for seat ${this.selectedSeat.seat_number}`);
      this.selectedSeat = null;
      this.cdr.markForCheck();
    }
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

  /**
   * Auto-select timing slot and membership plan based on selected seat
   */
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

  /**
   * Auto-select membership plan based on timing section
   */
  private autoSelectMembershipPlan(timingSection: string): void {
    // Update form model for auto-selection
    this.bookingFormData.timing = timingSection;
    this.bookingFormData.purpose = timingSection;
    
    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  // Get seats for selected timing section
  getSeatsForCurrentTiming(): Seat[] {
    // For demo purposes, we'll show different seat availability based on timing
    // In real implementation, this would come from backend with actual booking data
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

  // BOOK SEAT */
  onBookSeat(form: NgForm) {
    if (!form.valid || !this.selectedSeat) {
      console.log('Form invalid or no seat selected:', { valid: form.valid, selectedSeat: this.selectedSeat });
      return;
    }

    // Debug selected seat data
    console.log('Selected seat details:', {
      seat: this.selectedSeat,
      seat_number: this.selectedSeat.seat_number,
      id: this.selectedSeat.id,
      status: this.selectedSeat.status
    });

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
      purpose: form.value.purpose,
      special_requests: '' // Add empty special_requests as it's expected by backend
    };

    // Add payment fields based on payment method
    if (form.value.payment === 'offline') {
      // Offline payment - no payment fields needed
      console.log('Creating offline booking:', booking);
    } else {
      // Online payment - will be handled in payment step
      console.log('Preparing online booking:', booking);
    }

    // 🔹 OFFLINE FLOW
    if (form.value.payment === 'offline') {
      console.log('Creating offline booking:', booking);
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
            const friendlyMessage = ErrorHandler.parseError(error);
            alert(friendlyMessage || 'Booking failed. Please try again.');
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
      event.target.value = ''; // Clear input
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      this.fileErrorMessage = 'File size must be less than 5MB. Please choose a smaller image.';
      this.selectedFile = null;
      event.target.value = ''; // Clear input
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
        console.error('Booking failed:', error);
        this.loading = false;
        this.paymentFailed = true;

        // Use ErrorHandler for user-friendly messages
        if (error.status === 401) {
          this.paymentErrorMessage = 'Authentication failed. Please log in again.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          // Use ErrorHandler to get user-friendly message
          this.paymentErrorMessage = ErrorHandler.parseError(error);
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
      'Payment verification failed. Please ensure your payment screenshot is clear and shows complete transaction details.';
  }

  // Time slot management methods
  showTimeSlotModal() {
    this.showTimeSlotModalFlag = true;
  }

  closeTimeSlotModal() {
    this.showTimeSlotModalFlag = false;
    this.selectedTimeSlot = null;
  }

  addTimeSlot() {
    if (this.timeSlotForm.valid) {
      const newSlot: TimeSlot = {
        id: Date.now(),
        start_time: this.timeSlotForm.value.start_time,
        end_time: this.timeSlotForm.value.end_time,
        available_seats: this.timeSlotForm.value.available_seats || 50,
        created_at: new Date().toISOString()
      };
      
      this.timeSlots.push(newSlot);
      this.timeSlotForm.reset();
      this.closeTimeSlotModal();
      alert('Time slot added successfully!');
    }
  }

  deleteTimeSlot(id: number) {
    this.timeSlots = this.timeSlots.filter(slot => slot.id !== id);
    alert('Time slot deleted successfully!');
  }
}
