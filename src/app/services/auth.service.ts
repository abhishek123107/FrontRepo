import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ErrorHandler } from '../utils/error-handler';

// Interface for User Data
export interface User {
  id?: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  student_id?: string;
  department?: string;
  year_of_study?: number;
  address?: string;
  document?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  avatar?: string;
  consistency_score?: number;
}

// Interface for Auth API Response
export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  /** REGISTER - नया स्टूडेंट रजिस्टर करने के लिए */
  register(data: any): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/accounts/register/`, data)
      .pipe(
        tap((res) => this.setSession(res)),
        catchError((err) => {
          const friendlyError = ErrorHandler.parseError(err);
          return throwError(() => new Error(friendlyError));
        })
      );
  }

  /** LOGIN */
  login(data: {
    email_or_phone: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/accounts/login/`, data)
      .pipe(
        tap((res) => this.setSession(res)),
        catchError((err) => {
          const friendlyError = ErrorHandler.parseError(err);
          return throwError(() => new Error(friendlyError));
        })
      );
  }

  /** isAuthenticated - चेक करने के लिए कि यूजर लॉगिन है या नहीं */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // टोकन की एक्सपायरी चेक करना (Base64 decode)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }

  
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    // !! का मतलब है कि अगर वैल्यू null है तो false रिटर्न करो, वरना true
    return user ? !!(user.is_staff || user.is_superuser) : false;
  }

  /** चेक करें कि क्या यूजर स्टूडेंट है */
  isStudent(): boolean {
    const user = this.getCurrentUser();
    return user ? !(user.is_staff || user.is_superuser) : false;
  }

  /** Token Refresh Logic */
  refreshToken(): Observable<{ access: string }> {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return throwError(() => new Error('No refresh token found'));

    console.log('🔄 Refreshing token...');
    return this.http
      .post<{ access: string }>(`${this.apiUrl}/auth/token/refresh/`, {
        refresh,
      })
      .pipe(
        tap((res) => {
          console.log('✅ Token refreshed successfully');
          this.saveToken(res.access);
        }),
        catchError((err) => {
          console.error('❌ Token refresh failed:', err);
          this.logout();
          return throwError(() => new Error('Session expired. Please login again.'));
        })
      );
  }

  saveToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getProfile(): Observable<User> {
    const token = this.getToken();
    const httpOptions = token ? { 
      headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` })
    } : {};
    return this.http.get<User>(`${this.apiUrl}/accounts/profile/`, httpOptions);
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/accounts/profile/`, data).pipe(
      tap((updatedUser) => {
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  private setSession(res: AuthResponse): void {
    console.log('Setting session:', res);
    localStorage.setItem('access_token', res.access);
    localStorage.setItem('refresh_token', res.refresh);
    localStorage.setItem('current_user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
    console.log('Session set successfully.');
  }

  private restoreSession(): void {
    const user = localStorage.getItem('current_user');
    const token = localStorage.getItem('access_token');
    console.log('Restoring session...');
    console.log('Stored user:', user);
    console.log(
      'Stored token:',
      token ? token.substring(0, 20) + '...' : 'No token'
    );

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        this.currentUserSubject.next(parsedUser);
        console.log(
          'Session restored successfully for user:',
          parsedUser.email
        );
      } catch (e) {
        console.error('Error parsing stored user data:', e);
        this.logout();
      }
    } else {
      console.log('No active session to restore.');
    }
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }
}
