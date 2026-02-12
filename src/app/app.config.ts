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
          let url = req.url;

          // Fix double slash issue by normalizing URL
          if (url.includes('api//')) {
            url = url.replace('api//', 'api/');
            console.log('🔧 Fixed double slash in URL:', url);
          }

          console.log('🌐 HTTP Request:', url);
          console.log('🔑 Token available:', !!token);

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

          // Add token to request if it exists
          if (token) {
            // Clean token (remove quotes if JSON.stringified)
            let cleanToken = token;
            try {
              if (token.startsWith('"') && token.endsWith('"')) {
                cleanToken = JSON.parse(token);
              }
            } catch (e) {
              console.warn('⚠️ Token parsing error:', e);
            }

            if (cleanToken && cleanToken.trim()) {
              const authReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${cleanToken.trim()}`,
                },
              });
              console.log('🔐 Adding Bearer token to:', url);
              console.log('🔐 Token preview:', cleanToken.substring(0, 20) + '...');
              return next(authReq);
            } else {
              console.error('❌ Token is empty or invalid');
            }
          } else {
            console.error('❌ No token found for protected endpoint:', url);
          }

          return next(req);
        },
      ])
    ),
    AuthService
  ],
};
