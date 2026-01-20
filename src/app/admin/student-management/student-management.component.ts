import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

export interface Student {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  student_id?: string;
  department?: string;
  year_of_study?: number;
  membership_type: 'basic' | 'premium' | 'vip';
  membership_status: string;
  total_bookings: number;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
}

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './student-management.component.html',
  styleUrl: './student-management.component.css',
})
export class StudentManagementComponent implements OnInit {
  students: Student[] = [];
  filteredStudents: Student[] = [];
  isLoading = false;
  searchTerm = '';
  selectedDepartment = '';
  selectedMembership = '';
  selectedYear = '';
  
  // Statistics
  totalStudents = 0;
  activeStudents = 0;
  premiumMembers = 0;
  basicMembers = 0;
  
  departments = ['CSE', 'IT', 'ECE', 'ME', 'CE', 'EE'];
  membershipTypes = ['basic', 'premium', 'vip'];
  years = [1, 2, 3, 4];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadStatistics();
  }

  loadStudents(): void {
    this.isLoading = true;
    const token = this.authService.getToken();
    
    if (!token) {
      console.error('No authentication token found');
      this.isLoading = false;
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    this.http.get<Student[]>(`${environment.apiUrl}/accounts/users/`, { headers })
      .subscribe({
        next: (data) => {
          // Filter to show only students (non-staff users)
          this.students = data.filter(user => !user.is_staff && !user.is_superuser);
          this.filteredStudents = [...this.students];
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading students:', error);
          this.isLoading = false;
        }
      });
  }

  loadStatistics(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    this.http.get<Student[]>(`${environment.apiUrl}/accounts/users/`, { headers })
      .subscribe({
        next: (data) => {
          const students = data.filter(user => !user.is_staff && !user.is_superuser);
          
          this.totalStudents = students.length;
          this.activeStudents = students.filter(s => s.is_active).length;
          this.premiumMembers = students.filter(s => s.membership_type === 'premium').length;
          this.basicMembers = students.filter(s => s.membership_type === 'basic').length;
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.students];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.username.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.first_name.toLowerCase().includes(term) ||
        student.last_name.toLowerCase().includes(term) ||
        student.student_id?.toLowerCase().includes(term) ||
        student.phone?.toLowerCase().includes(term)
      );
    }

    // Department filter
    if (this.selectedDepartment) {
      filtered = filtered.filter(student => student.department === this.selectedDepartment);
    }

    // Membership filter
    if (this.selectedMembership) {
      filtered = filtered.filter(student => student.membership_type === this.selectedMembership);
    }

    // Year filter
    if (this.selectedYear) {
      filtered = filtered.filter(student => student.year_of_study === parseInt(this.selectedYear));
    }

    this.filteredStudents = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDepartment = '';
    this.selectedMembership = '';
    this.selectedYear = '';
    this.applyFilters();
  }

  toggleStudentStatus(student: Student): void {
    const token = this.authService.getToken();
    if (!token) return;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const newStatus = !student.is_active;

    this.http.patch(`${environment.apiUrl}/accounts/users/${student.id}/`, 
      { is_active: newStatus }, { headers })
      .subscribe({
        next: () => {
          student.is_active = newStatus;
          this.loadStatistics();
          console.log(`Student ${newStatus ? 'activated' : 'deactivated'} successfully`);
        },
        error: (error) => {
          console.error('Error updating student status:', error);
        }
      });
  }

  upgradeMembership(student: Student): void {
    const token = this.authService.getToken();
    if (!token) return;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const newMembership = student.membership_type === 'basic' ? 'premium' : 'vip';

    this.http.patch(`${environment.apiUrl}/accounts/users/${student.id}/`, 
      { membership_type: newMembership }, { headers })
      .subscribe({
        next: () => {
          student.membership_type = newMembership;
          this.loadStatistics();
          console.log(`Membership upgraded to ${newMembership} successfully`);
        },
        error: (error) => {
          console.error('Error upgrading membership:', error);
        }
      });
  }

  exportToCSV(): void {
    const data = this.filteredStudents;
    if (data.length === 0) return;

    const headers = [
      'ID', 'Username', 'Email', 'First Name', 'Last Name', 'Phone',
      'Student ID', 'Department', 'Year', 'Membership Type', 'Status',
      'Total Bookings', 'Active', 'Join Date'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(student => [
        student.id,
        student.username,
        student.email,
        student.first_name || '',
        student.last_name || '',
        student.phone || '',
        student.student_id || '',
        student.department || '',
        student.year_of_study || '',
        student.membership_type || '',
        student.membership_status || '',
        student.total_bookings || 0,
        student.is_active,
        student.date_joined || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  refreshData(): void {
    this.loadStudents();
    this.loadStatistics();
  }

  viewStudentDetails(student: Student): void {
    // For now, just log the student details
    console.log('View student details:', student);
    alert(`Student Details:\n\nName: ${student.first_name} ${student.last_name}\nEmail: ${student.email}\nPhone: ${student.phone || 'N/A'}\nDepartment: ${student.department || 'N/A'}\nMembership: ${student.membership_type}\nStatus: ${student.membership_status}`);
  }

  getMembershipStatusColor(status: string): string {
    switch (status) {
      case 'Active': return '#4caf50';
      case 'Expired': return '#f44336';
      case 'No Active Membership': return '#ff9800';
      default: return '#757575';
    }
  }

  getMembershipTypeColor(type: string): string {
    switch (type) {
      case 'basic': return '#2196f3';
      case 'premium': return '#9c27b0';
      case 'vip': return '#ff9800';
      default: return '#757575';
    }
  }
}
