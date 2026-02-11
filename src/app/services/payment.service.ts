import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Payment {
  id?: number;
  date: string;
  description: string;
  amount: number;
  method: string;
  status: 'paid' | 'pending' | 'rejected';
  transaction_id?: string;
  account_holder_name?: string;
  screenshot?: string;
  created_at?: string;
  username?: string; // For admin view
  user_email?: string; // For admin view
  membership_plan?: number;
  plan_name?: string;
}

// Paginated response interface
interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payment[];
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  // Use environment.apiUrl + '/payments/'
  private apiUrl = `${environment.apiUrl}/payments/`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /** Get all payment history for current user */
  getPayments(): Observable<Payment[]> {
    console.log('🔄 PaymentService: Fetching all payments...');
    // Get all payments without pagination limit
    const params = new HttpParams().set('page_size', '1000'); // Large number to get all records
    const headers = this.getAuthHeaders();
    console.log('🔄 PaymentService: API URL:', this.apiUrl);
    console.log('🔄 PaymentService: Params:', params.toString());
    console.log('🔄 PaymentService: Auth headers present:', !!headers.get('Authorization'));

    return this.http.get<Payment[] | PaginatedResponse>(this.apiUrl, { params, headers }).pipe(
      map((response) => {
        console.log('✅ PaymentService: Raw response received:', response);
        
        // Handle both paginated response and direct array response
        if (response && typeof response === 'object' && 'results' in response) {
          console.log('✅ PaymentService: Extracting results from paginated response');
          const paginatedResponse = response as PaginatedResponse;
          console.log('✅ PaymentService: Total payments found:', paginatedResponse.results.length);
          return paginatedResponse.results;
        }
        // Handle direct array response
        console.log('✅ PaymentService: Returning direct array response');
        const paymentArray = response as Payment[];
        console.log('✅ PaymentService: Total payments found:', paymentArray.length);
        return paymentArray;
      })
    );
  }

  /** Submit new payment with screenshot */
  submitPayment(formData: FormData): Observable<Payment> {
    console.log(' PaymentService: Submitting payment...');
    console.log(' PaymentService: FormData contents:');
    formData.forEach((value, key) => {
      if (key === 'screenshot') {
        console.log(`  ${key}: [File: ${(value as File).name}, Size: ${(value as File).size} bytes]`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });

    const headers = this.getAuthHeaders();
    // Remove Content-Type header for FormData to let browser set it automatically with boundary
    const authHeaders = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    return this.http.post<Payment>(this.apiUrl, formData, { headers: authHeaders });
  }
}