import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentRecord {
  id: number;
  user: number;
  username: string;
  user_email: string;
  description: string;
  amount: number;
  method: 'online' | 'offline';
  status: 'pending' | 'paid' | 'rejected';
  transaction_id?: string;
  account_holder_name?: string;
  date: string;
  screenshot?: string;
  membership_plan?: number;
  plan_name?: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentVerificationService {
  private baseUrl = 'http://localhost:8001/api/payments';

  constructor(private http: HttpClient) {}

  // Get all payment records (admin)
  getAllPayments(): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(`${this.baseUrl}/`);
  }

  // Get payment by ID
  getPayment(id: number): Observable<PaymentRecord> {
    return this.http.get<PaymentRecord>(`${this.baseUrl}/${id}/`);
  }

  // Approve payment
  approvePayment(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/approve/`, {});
  }

  // Reject payment
  rejectPayment(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/reject/`, {});
  }

  // Delete payment
  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }

  // Get payment statistics
  getPaymentStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats/`);
  }

  // Get payments by status
  getPaymentsByStatus(status: string): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(`${this.baseUrl}/?status=${status}`);
  }

  // Get payments by date range
  getPaymentsByDateRange(startDate: string, endDate: string): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(`${this.baseUrl}/?start_date=${startDate}&end_date=${endDate}`);
  }

  // Get payments by user
  getPaymentsByUser(userId: number): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(`${this.baseUrl}/?user=${userId}`);
  }
}
