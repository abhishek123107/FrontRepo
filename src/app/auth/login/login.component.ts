import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  Router,
  RouterLink,
  RouterModule,
  ActivatedRoute,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ErrorHandler } from '../../utils/error-handler';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    RouterModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  returnUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email_or_phone: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // Already logged in
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
      return;
    }

    // Get return URL if present
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;
  }

  onLogin(): void {
    if (!this.loginForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.loading = false;

        // ✅ Use response.user directly
        if (res.user.is_staff || res.user.is_superuser) {
          alert('✅ Login successful!');
          this.router.navigate(['/admin']);
        } else {
          alert('✅ Login successful!');
          this.router.navigate([this.returnUrl || '/student']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = ErrorHandler.parseError(err);
        console.error('Login error:', err);
      },
    });
  }

  private redirectBasedOnRole(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (user.is_staff || user.is_superuser) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate([this.returnUrl || '/student']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  get emailOrPhone() {
    return this.loginForm.get('email_or_phone');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
