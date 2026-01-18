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
  membership_expiry?: string;
  membership_status: string;
  total_bookings: number;
  total_attendance_hours: number;
  consistency_score: number;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login?: string;
  avatar?: string;
}
