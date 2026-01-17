import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  profileForm: FormGroup;
  loading = false;
  success: string | null = null;
  error: string | null = null;
  isEditMode = false;   // 🔥 TOGGLE FLAG
  private subscription = new Subscription();

  constructor(private authService: AuthService, private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      first_name: [''],
      last_name: [''],
      email: [{ value: '', disabled: true }], // ❌ email edit nahi hoga
      phone: [''],
      avatar: [''],
      student_id: [{ value: '', disabled: true }],
      department: [''],
      year_of_study: [''],
    });
  }

  ngOnInit(): void {
    this.subscription.add(
      this.authService.getProfile().subscribe({
        next: (profile) => {
          this.user = profile;
          this.populateForm();
        },
        error: () => {
          this.error = 'Failed to load profile';
        },
      })
    );
  }

  populateForm(): void {
    if (!this.user) return;

    this.profileForm.patchValue({
      first_name: this.user.first_name,
      last_name: this.user.last_name,
      email: this.user.email,
      phone: this.user.phone,
      student_id: this.user.student_id,
      department: this.user.department,
      year_of_study: this.user.year_of_study,
    });
  }

  toggleEdit(): void {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.profileForm.enable();
      this.profileForm.get('email')?.disable();
      this.profileForm.get('student_id')?.disable();
    } else {
      this.profileForm.disable();
      this.populateForm();
      this.error = null;
      this.success = null;
    }
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid) return;

    this.loading = true;

    this.subscription.add(
      this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.isEditMode = false;
          this.profileForm.disable();
          this.success = 'Profile updated successfully ✅';
          this.loading = false;
        },
        error: () => {
          this.error = 'Profile update failed ❌';
          this.loading = false;
        },
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
