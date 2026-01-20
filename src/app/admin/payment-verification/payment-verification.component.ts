import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { PaymentVerificationService, PaymentRecord } from './payment-verification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment-verification',
  standalone: true,
  imports: [FormsModule, CommonModule, DatePipe],
  templateUrl: './payment-verification.component.html',
  styleUrl: './payment-verification.component.css',
})
export class PaymentVerificationComponent implements OnInit {
  statusFilter: string = 'all';
  methodFilter: string = 'all';
  startDate: string = '';
  endDate: string = '';
  showProofModal = false;
  selectedProof: string = '';
  selectedPayment: PaymentRecord | null = null;

  payments: PaymentRecord[] = [];
  filteredPayments: PaymentRecord[] = [];
  loading = false;
  error: string | null = null;

  constructor(private paymentService: PaymentVerificationService) {}

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.loading = true;
    this.error = null;
    
    this.paymentService.getAllPayments().subscribe({
      next: (payments) => {
        this.payments = payments;
        this.filteredPayments = [...payments];
        this.filterPayments();
        this.loading = false;
        console.log('Payments loaded successfully:', payments.length, 'records');
      },
      error: (err) => {
        this.error = 'Failed to load payments. Please check your authentication and try again.';
        this.loading = false;
        console.error('Error loading payments:', err);
        
        if (err.status === 401) {
          this.error = 'Authentication required. Please login again.';
        } else if (err.status === 403) {
          this.error = 'Admin access required to view payments.';
        } else if (err.status === 0) {
          this.error = 'Unable to connect to server. Please check if the backend is running.';
        }
      }
    });
  }

  filterPayments() {
    this.filteredPayments = this.payments.filter((payment) => {
      const statusMatch =
        this.statusFilter === 'all' || payment.status === this.statusFilter;
      const methodMatch =
        this.methodFilter === 'all' || payment.method === this.methodFilter;

      let dateMatch = true;
      if (this.startDate) {
        const paymentDate = new Date(payment.date);
        const startFilter = new Date(this.startDate);
        dateMatch = dateMatch && paymentDate >= startFilter;
      }
      if (this.endDate) {
        const paymentDate = new Date(payment.date);
        const endFilter = new Date(this.endDate + 'T23:59:59');
        dateMatch = dateMatch && paymentDate <= endFilter;
      }

      return statusMatch && methodMatch && dateMatch;
    });
  }

  approvePayment(payment: PaymentRecord) {
    if (confirm(`Are you sure you want to approve payment of ₹${payment.amount} from ${payment.username}?`)) {
      this.paymentService.approvePayment(payment.id).subscribe({
        next: () => {
          payment.status = 'paid';
          this.filterPayments();
          alert('Payment approved successfully!');
          console.log(`Payment ${payment.id} approved`);
        },
        error: (err) => {
          console.error('Error approving payment:', err);
          let errorMessage = 'Failed to approve payment. Please try again.';
          
          if (err.status === 401) {
            errorMessage = 'Authentication required. Please login again.';
          } else if (err.status === 403) {
            errorMessage = 'Admin access required to approve payments.';
          } else if (err.status === 404) {
            errorMessage = 'Payment not found.';
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  rejectPayment(payment: PaymentRecord) {
    if (confirm(`Are you sure you want to reject payment of ₹${payment.amount} from ${payment.username}?`)) {
      this.paymentService.rejectPayment(payment.id).subscribe({
        next: () => {
          payment.status = 'rejected';
          this.filterPayments();
          alert('Payment rejected successfully!');
          console.log(`Payment ${payment.id} rejected`);
        },
        error: (err) => {
          console.error('Error rejecting payment:', err);
          let errorMessage = 'Failed to reject payment. Please try again.';
          
          if (err.status === 401) {
            errorMessage = 'Authentication required. Please login again.';
          } else if (err.status === 403) {
            errorMessage = 'Admin access required to reject payments.';
          } else if (err.status === 404) {
            errorMessage = 'Payment not found.';
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  deletePayment(payment: PaymentRecord) {
    if (confirm(`Are you sure you want to delete this payment record? This action cannot be undone.`)) {
      this.paymentService.deletePayment(payment.id).subscribe({
        next: () => {
          this.payments = this.payments.filter((p) => p.id !== payment.id);
          this.filterPayments();
          alert('Payment deleted successfully!');
          console.log(`Payment ${payment.id} deleted`);
        },
        error: (err) => {
          console.error('Error deleting payment:', err);
          alert('Failed to delete payment. Please try again.');
        }
      });
    }
  }

  clearAllPayments() {
    if (confirm(`Are you sure you want to clear all payment records? This action cannot be undone.`)) {
      // This would require a bulk delete endpoint in the backend
      // For now, we'll delete each payment individually
      const pendingPayments = this.payments.filter(p => p.status === 'pending');
      if (pendingPayments.length === 0) {
        alert('No pending payments to clear.');
        return;
      }

      let deletedCount = 0;
      pendingPayments.forEach(payment => {
        this.paymentService.deletePayment(payment.id).subscribe({
          next: () => {
            deletedCount++;
            this.payments = this.payments.filter((p) => p.id !== payment.id);
            this.filterPayments();
            
            if (deletedCount === pendingPayments.length) {
              alert(`Successfully cleared ${deletedCount} pending payments!`);
            }
          },
          error: (err) => {
            console.error(`Error deleting payment ${payment.id}:`, err);
          }
        });
      });
    }
  }

  viewProof(payment: PaymentRecord) {
    this.selectedPayment = payment;
    this.selectedProof = payment.screenshot || '';
    this.showProofModal = true;
  }

  closeProofModal() {
    this.showProofModal = false;
    this.selectedProof = '';
    this.selectedPayment = null;
  }

  getPaymentImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.backendUrl}${url}`;
  }

  getStats(status: string): number {
    return this.payments.filter((payment) => payment.status === status).length;
  }

  getTotalAmount(): number {
    return this.payments
      .filter((payment) => payment.status === 'paid')
      .reduce((total, payment) => total + payment.amount, 0);
  }

  getPendingAmount(): number {
    return this.payments
      .filter((payment) => payment.status === 'pending')
      .reduce((total, payment) => total + payment.amount, 0);
  }

  onFiltersChanged() {
    this.filterPayments();
  }

  onImageError(event: any) {
    // Handle image loading errors by setting a fallback or hiding the image
    event.target.style.display = 'none';
    console.warn('Image failed to load:', event.target.src);
  }
}
