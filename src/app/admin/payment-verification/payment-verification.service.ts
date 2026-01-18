import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all payment records (admin)
  getAllPayments(): Observable<PaymentRecord[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<PaymentRecord[]>(`${this.baseUrl}/`, { headers });
  }

  // Get payment by ID
  getPayment(id: number): Observable<PaymentRecord> {
    const headers = this.getAuthHeaders();
    return this.http.get<PaymentRecord>(`${this.baseUrl}/${id}/`, { headers });
  }

  // Approve payment
  approvePayment(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.baseUrl}/${id}/approve/`, {}, { headers });
  }

  // Reject payment
  rejectPayment(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.baseUrl}/${id}/reject/`, {}, { headers });
  }

  // Delete payment
  deletePayment(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.baseUrl}/${id}/`, { headers });
  }

  // Get payment statistics
  getPaymentStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.baseUrl}/stats/`, { headers });
  }

  // Get payments by status
  getPaymentsByStatus(status: string): Observable<PaymentRecord[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<PaymentRecord[]>(`${this.baseUrl}/?status=${status}`, { headers });
  }

  // Get payments by date range
  getPaymentsByDateRange(startDate: string, endDate: string): Observable<PaymentRecord[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<PaymentRecord[]>(`${this.baseUrl}/?start_date=${startDate}&end_date=${endDate}`, { headers });
  }

  // Get payments by user
  getPaymentsByUser(userId: number): Observable<PaymentRecord[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<PaymentRecord[]>(`${this.baseUrl}/?user=${userId}`, { headers });
  }
}
