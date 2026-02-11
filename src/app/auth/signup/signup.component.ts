import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthResponse, AuthService } from '../../services/auth.service';
import { ErrorHandler } from '../../utils/error-handler';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    RouterModule,
  
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.signupForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.pattern(/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        password2: ['', [Validators.required]],
        first_name: ['', [Validators.required]],
        last_name: ['', [Validators.required]],
        student_id: [''],
        department: [''],
        year_of_study: [''],
        address: ['', [Validators.required]],
        document: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
    }
  }

  /** Handle file selection */
  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.signupForm.patchValue({
        document: file
      });
      // Mark as touched to trigger validation
      this.signupForm.get('document')?.markAsTouched();
    }
  }

  /** Password match validator */
  passwordMatchValidator(group: FormGroup): any {
    const password = group.get('password')?.value;
    const confirm = group.get('password2')?.value;

    if (password && confirm && password !== confirm) {
      group.get('password2')?.setErrors({ mismatch: true });
    } else {
      const errors = group.get('password2')?.errors;
      if (errors) {
        delete errors['mismatch'];
        group.get('password2')?.setErrors(
          Object.keys(errors).length ? errors : null
        );
      }
    }
    return null;
  }

  /** Signup submit */
  onSignup(): void {
    if (!this.signupForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Add all form fields
    Object.keys(this.signupForm.value).forEach(key => {
      if (key === 'document') {
        // Handle file upload
        const file = this.signupForm.get(key)?.value;
        if (file) {
          formData.append('document', file);
        }
      } else if (key === 'password2') {
        // Fix field name mismatch: password2 -> password_confirm
        formData.append('password_confirm', this.signupForm.get(key)?.value);
      } else {
        formData.append(key, this.signupForm.get(key)?.value);
      }
    });
    
    this.authService.register(formData).subscribe({
      next: (res: AuthResponse) => {
        this.loading = false;
        
        // Auto-login को prevent करने के लिए session clear करें
        this.authService.logout();
        
        // Success popup दिखाएं
        alert('✅ Signup successful! Please login to continue.');
        
        // Login page पर redirect करें
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = ErrorHandler.parseError(err);
        console.error('Signup error:', err);
      }
    });
  }
  /** Redirect based on role after signup/login */
  private redirectBasedOnRole(): void {
    const user = this.authService.getCurrentUser();

    if (!user) {
      console.error('❌ No user found after signup');
      this.router.navigate(['/signup']);
      return;
    }

    if (user.is_staff || user.is_superuser) {
      console.log('🔐 Redirecting to /admin');
      this.router.navigate(['/admin']);
    } else {
      console.log('👤 Redirecting to /student');
      this.router.navigate(['/student']);
    }
  }

  /** Mark all controls as touched for validation */
  private markFormGroupTouched(): void {
    Object.keys(this.signupForm.controls).forEach((key) => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }

  // Getter methods for template
  get username() {
    return this.signupForm.get('username');
  }
  get email() {
    return this.signupForm.get('email');
  }
  get phone() {
    return this.signupForm.get('phone');
  }
  get password() {
    return this.signupForm.get('password');
  }
  get password2() {
    return this.signupForm.get('password2');
  }
  get firstName() {
    return this.signupForm.get('first_name');
  }
  get lastName() {
    return this.signupForm.get('last_name');
  }
  get address() {
    return this.signupForm.get('address');
  }
  get document() {
    return this.signupForm.get('document');
  }
}
