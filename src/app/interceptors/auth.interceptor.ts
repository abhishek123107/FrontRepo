import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('access_token');
    const url = req.url;

    console.log('🌐 HTTP Request:', url);

    // Public endpoints that don't need authentication
    const publicEndpoints = [
      'accounts/login',
      'accounts/register',
      'auth/token/refresh',
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      url.includes(endpoint)
    );

    if (isPublicEndpoint) {
      console.log('🔓 Public endpoint, no token needed:', url);
      return next.handle(req);
    }

    // Add token to request if it exists
    if (token) {
      const cleanToken = this.cleanToken(token);
      if (cleanToken && cleanToken.trim()) {
        req = this.addToken(req, cleanToken.trim());
        console.log('🔐 Adding Bearer token to:', url);
      }
    }

    return next.handle(req).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          console.warn('❌ 401 Unauthorized, attempting token refresh...');
          return this.handle401Error(req, next);
        }
        return throwError(error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private cleanToken(token: string): string {
    try {
      if (token.startsWith('"') && token.endsWith('"')) {
        return JSON.parse(token);
      }
    } catch (e) {
      console.warn('⚠️ Token parsing error:', e);
    }
    return token;
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        return this.authService.refreshToken().pipe(
          switchMap((tokenResponse: any) => {
            this.isRefreshing = false;
            const newToken = tokenResponse.access;
            localStorage.setItem('access_token', newToken);
            this.refreshTokenSubject.next(newToken);
            return next.handle(this.addToken(request, newToken));
          }),
          catchError((error) => {
            this.isRefreshing = false;
            this.authService.logout();
            return throwError(error);
          })
        );
      } else {
        // No refresh token, logout user
        this.authService.logout();
        return throwError('No refresh token available');
      }
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addToken(request, token)))
    );
  }
}
