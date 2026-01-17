import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  // ध्यान दें: हमने URL को Django के URL Patterns के हिसाब से सेट किया है
  private apiUrl = 'http://localhost:8001/api/payments/';

  constructor(private http: HttpClient) { }

  /** Get all payment history for current user */
  getPayments(): Observable<Payment[]> {
    console.log('🔄 PaymentService: Fetching payments...');
    // Backend paginated response return करता है, इसलिए हमें results array extract करना होगा
    // साथ ही page_size बड़ा set करें ताकि सभी records मिलें
    const params = new HttpParams().set('page_size', '1000');
    console.log('🔄 PaymentService: API URL:', this.apiUrl);
    console.log('🔄 PaymentService: Params:', params.toString());

    return this.http.get<PaginatedResponse | Payment[]>(this.apiUrl, { params }).pipe(
      map((response) => {
        console.log('✅ PaymentService: Raw response received:', response);
        // अगर paginated response है (results field के साथ)
        if (response && typeof response === 'object' && 'results' in response) {
          console.log('✅ PaymentService: Extracting results from paginated response');
          return (response as PaginatedResponse).results;
        }
        // अगर direct array है
        console.log('✅ PaymentService: Returning direct array response');
        return response as Payment[];
      })
    );
  }

  /** Submit new payment with screenshot */
  submitPayment(formData: FormData): Observable<Payment> {
    console.log('🔄 PaymentService: Submitting payment...');
    console.log('🔄 PaymentService: FormData contents:');
    formData.forEach((value, key) => {
      if (key === 'screenshot') {
        console.log(`  ${key}: [File: ${(value as File).name}, Size: ${(value as File).size} bytes]`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });

    return this.http.post<Payment>(this.apiUrl, formData);
  }
}