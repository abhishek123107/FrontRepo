// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideHttpClient(
      withInterceptors([
        (req, next) => {
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
            return next(req);
          }

          // Check if token exists and is not expired
          if (token) {
            try {
              // Check token expiration
              const payload = JSON.parse(atob(token.split('.')[1]));
              const isExpired = Date.now() >= payload.exp * 1000;

              if (isExpired) {
                console.warn('⏰ Token expired, attempting refresh...');
                // For now, just proceed without token - the error handler can refresh
                console.warn('❌ Token expired for protected endpoint:', url);
                return next(req);
              }

              // Clean token (remove quotes if JSON.stringified)
              let cleanToken = token;
              try {
                if (token.startsWith('"') && token.endsWith('"')) {
                  cleanToken = JSON.parse(token);
                }
              } catch (e) {
                console.warn('⚠️ Token parsing error:', e);
              }

              // Add Authorization header if token is valid
              if (cleanToken && cleanToken.trim()) {
                const authReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${cleanToken.trim()}`,
                  },
                });
                console.log('🔐 Adding Bearer token to:', url);
                return next(authReq);
              }
            } catch (e) {
              console.warn('⚠️ Token validation error:', e);
            }
          } else {
            console.warn('❌ No token found for protected endpoint:', url);
          }

          return next(req);
        },
      ])
    ),
    AuthService
  ],
};
