import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Payment, PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { SeatBooking, SeatBookingService } from '../../services/seat-booking.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css',
})
export class PaymentsComponent implements OnInit {
  payments: Payment[] = [];
  showPaymentForm = true;
  paymentStep = 2;
  selectedFile: File | null = null;
  loading = false;
  pendingBooking: SeatBooking | null = null;
  paymentForm!: FormGroup;

  // एडमिन की बैंक डिटेल्स (इसे आप यहाँ हार्डकोड कर सकते हैं)
  adminDetails = {
    accountName: 'Library Admin Official',
    accountNumber: '918273645510',
    ifsc: 'SBIN0004567',
    bankName: 'State Bank of India',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=UPI%20Payment%20for%20Library%20Seat%20Booking' // Working QR code
  };

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private seatBookingService: SeatBookingService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      payment_method: ['online', Validators.required],
      transaction_id: ['', Validators.required],
      account_holder_name: ['', Validators.required],
      payment_date: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if user is authenticated before loading payments
    if (!this.authService.isAuthenticated()) {
      console.warn('⚠️ User not authenticated, redirecting to login');
      alert('कृपया पहले login करें');
      this.router.navigate(['/login']);
      return;
    }
    
    // Check for pending booking from query params
    this.route.queryParams.subscribe(params => {
      if (params['fromBooking'] && localStorage.getItem('pendingBooking')) {
        this.pendingBooking = JSON.parse(localStorage.getItem('pendingBooking') || '{}');
        console.log('✅ Pending booking found:', this.pendingBooking);
        this.showPaymentForm = true; // Make sure payment form is open
        this.paymentStep = 2; // Go to payment details step
      } else {
        this.showPaymentForm = false; // Hide payment form if no pending booking
        this.paymentStep = 1; 
      }
    });

    this.loadPayments();
  }

  togglePaymentForm() {
    this.showPaymentForm = !this.showPaymentForm;
    this.paymentStep = 1; // रिसेट टू स्टेप 1
    this.selectedFile = null;
  }

  // अगले स्टेप पर जाने के लिए
  goToNextStep() {
    this.paymentStep = 2;
  }

  prevStep() {
    this.paymentStep = 1;
  }


  // फाइल चुनने के लिए
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  loadPayments() {
    console.log('🔄 Loading payments...');
    this.loading = true;

    // Debug authentication status
    const isAuthenticated = this.authService.isAuthenticated();
    const token = this.authService.getToken();
    const currentUser = this.authService.getCurrentUser();

    console.log('🔍 Auth Debug Info:');
    console.log('  - Is Authenticated:', isAuthenticated);
    console.log('  - Token Present:', !!token);
    console.log('  - Token Length:', token ? token.length : 0);
    console.log('  - Current User:', currentUser);
    console.log('  - Token Preview:', token ? token.substring(0, 50) + '...' : 'No token');

    if (!isAuthenticated) {
      console.warn('❌ User not authenticated, cannot load payments');
      this.loading = false;
      alert('Authentication required. Please login first.');
      this.router.navigate(['/login']);
      return;
    }

    this.paymentService.getPayments().subscribe({
      next: (res) => {
        this.payments = res || [];
        this.loading = false;
        console.log('✅ Payments loaded successfully:', res);
        console.log('✅ Total payments:', this.payments.length);
        console.log('✅ Payment details:', this.payments);
      },
      error: (err) => {
        console.error('❌ Error loading payments:', err);
        console.error('❌ Error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          url: err.url
        });
        
        // Check if it's an authentication error
        if (err.status === 401 || err.status === 403) {
          const token = this.authService.getToken();
          console.error('🔑 Current token:', token ? 'Exists' : 'Missing');
          
          if (!token) {
            alert('आप logged in नहीं हैं। कृपया पहले login करें।');
            this.router.navigate(['/login']);
            return;
          }
        }
        
        this.loading = false;
        const errorMsg = err.error?.detail || err.error?.message || err.message || 'Unknown error';
        alert(`Payment history load नहीं हो पाई: ${errorMsg}\n\nकृपया check करें:\n1. आप logged in हैं\n2. Backend server चल रहा है\n3. Network connection सही है`);
      },
    });
  }

  trackByPaymentId(index: number, payment: Payment): number {
    return payment.id || index;
  }

  onMakePayment() {
    if (!this.paymentForm.valid || !this.selectedFile) {
      alert('कृपया सभी जानकारी भरें और स्क्रीनशॉट अपलोड करें।');
      return;
    }

    this.loading = true;

    const formValue = this.paymentForm.value;

    // इमेज भेजने के लिए FormData का इस्तेमाल ज़रूरी है
    const formData = new FormData();
    formData.append('description', formValue.description);
    formData.append('amount', formValue.amount.toString());
    formData.append('method', 'online');
    formData.append('transaction_id', formValue.transaction_id);
    formData.append('account_holder_name', formValue.account_holder_name);
    formData.append('date', formValue.payment_date); // यूजर द्वारा चुनी गई डेट
    formData.append('screenshot', this.selectedFile);
    // Note: status is set to 'pending' by default in backend, no need to send it

    this.paymentService.submitPayment(formData).subscribe({
      next: (res: Payment) => {
        this.loading = false;
        console.log('✅ Payment submitted successfully:', res);
        alert('✅ Payment सफलतापूर्वक सबमिट हो गया! एडमिन के अप्रूवल का इंतज़ार करें।');
        this.showPaymentForm = false;
        this.paymentStep = 1;
        this.selectedFile = null;
        this.paymentForm.reset();
        // Refresh payment history
        this.loadPayments();

        // Booking finalize करें अगर pendingBooking है
        if (this.pendingBooking) {
          const bookingWithPayment: SeatBooking = {
            ...this.pendingBooking,
            payment_id: res.id, // Newly created payment ID from backend
            status: 'pending', // Payment के बाद भी booking pending रहेगी admin approval तक
          };

          this.seatBookingService.bookSeat(bookingWithPayment).subscribe({
            next: (bookingRes) => {
              console.log('✅ Seat booking finalized after payment:', bookingRes);
              alert('✅ सीट सफलतापूर्वक बुक हो गई है! पेमेंट एडमिन अप्रूवल के लिए है।');
              localStorage.removeItem('pendingBooking'); // Remove pending booking
              this.pendingBooking = null;
              // this.router.navigate(['/student/dashboard']); // Go to dashboard
            },
            error: (bookingErr) => {
              console.error('❌ Error finalizing seat booking after payment:', bookingErr);
              alert('❌ सीट बुक करने में समस्या हुई। कृपया एडमिन से संपर्क करें।');
            },
          });
        } else {
          // अगर कोई pending booking नहीं है, तो सामान्य flow जारी रखें
        this.loadPayments();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Payment submission error:', err);
        const errorMsg = err.error?.detail || err.error?.message || 'Payment submission failed';
        alert(`❌ सबमिशन फेल हो गया: ${errorMsg}`);
      },
    });
  }

  // Test authentication manually
  testAuth() {
    const token = this.authService.getToken();
    if (!token) {
      console.error('❌ No token available for testing');
      alert('No token found. Please login first.');
      return;
    }

    console.log('🧪 Testing authentication with token...');
    console.log('Token preview:', token.substring(0, 50) + '...');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const params = new HttpParams().set('page_size', '1000');

    this.http.get('http://localhost:8000/api/payments/records/', { headers, params })
      .subscribe({
        next: (response) => {
          console.log('✅ Manual auth test successful:', response);
          alert('Authentication test successful! Token is working.');
        },
        error: (error) => {
          console.error('❌ Manual auth test failed:', error);
          alert(`Authentication test failed: ${error.status} - ${error.statusText}`);
        }
      });
  }
}