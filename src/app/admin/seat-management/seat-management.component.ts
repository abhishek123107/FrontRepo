import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Seat } from '../../models/seat.model';
import { SeatManagementService } from './seat-management.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-seat-management',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './seat-management.component.html',
  styleUrl: './seat-management.component.css',
})
export class SeatManagementComponent implements OnInit {
  seats: Seat[] = [];
  showModal = false;
  isEditing = false;
  currentSeat: Seat = { 
    id: 0, 
    seat_number: '', 
    status: 'available', 
    photo: '',
    has_power_outlet: false,
    has_monitor: false,
    is_near_window: false,
    is_accessible: false,
    seat_type: 'regular',
    time_slot: 'morning' // Add time slot property
  };
  selectedFile: File | null = null;
  loading = false;
  error: string | null = null;

  // Time slot options
  timeSlots = [
    { id: 'morning', name: 'Morning Shift', time: '6 AM - 11 AM', price: '₹300/- महीना' },
    { id: 'afternoon', name: 'Afternoon Shift', time: '11 AM - 4 PM', price: '₹350/- महीना' },
    { id: 'evening', name: 'Evening Shift', time: '4 PM - 9 PM', price: '₹300/- महीना' },
    { id: 'night', name: 'Night Shift', time: '7 PM - 6 AM', price: '₹350/- महीना' },
    { id: 'full-day', name: 'Full Day', time: '12 Hours', price: '₹500/- महीना' },
    { id: '24-7', name: '24/7 Access', time: 'Unlimited', price: '₹800/- महीना' }
  ];

  // Cache for time slot lookup to optimize performance
  private _timeSlotCache = new Map<string, string>();
  private _lastTimeSlotId: string = '';

  constructor(private seatService: SeatManagementService) {}

  /**
   * Helper method to get time slot name by ID
   * Optimized with caching for better performance
   */
  getTimeSlotName(timeSlotId: string): string {
    if (!timeSlotId) return '';
    
    // Return cached value if already computed
    if (this._timeSlotCache.has(timeSlotId)) {
      return this._timeSlotCache.get(timeSlotId)!;
    }
    
    // Find and cache the time slot name
    const timeSlot = this.timeSlots.find(slot => slot.id === timeSlotId);
    const slotName = timeSlot?.name || timeSlotId;
    this._timeSlotCache.set(timeSlotId, slotName);
    
    return slotName;
  }

  ngOnInit() {
    this.loadSeats();
  }

  loadSeats() {
    this.loading = true;
    this.error = null;
    
    this.seatService.getSeats().subscribe({
      next: (seats) => {
        this.seats = seats;
        this.loading = false;
        console.log('Seats loaded:', seats);
      },
      error: (err) => {
        this.error = 'Failed to load seats from server';
        this.loading = false;
        console.error('Error loading seats:', err);
      }
    });
  }

  openAddModal() {
    this.isEditing = false;
    this.currentSeat = { 
      id: 0, 
      seat_number: '', 
      status: 'available', 
      photo: '',
      has_power_outlet: false,
      has_monitor: false,
      is_near_window: false,
      is_accessible: false,
      seat_type: 'regular',
      time_slot: 'morning' // Default to morning shift
    };
    this.selectedFile = null;
    this.showModal = true;
  }

  editSeat(seat: Seat) {
    this.isEditing = true;
    this.currentSeat = { ...seat };
    this.selectedFile = null;
    this.showModal = true;
  }

  deleteSeat(seat: Seat) {
    if (confirm(`Are you sure you want to delete Seat ${seat.seat_number}?`)) {
      this.seatService.deleteSeat(seat.id).subscribe({
        next: () => {
          this.seats = this.seats.filter((s) => s.id !== seat.id);
          console.log(`Seat ${seat.seat_number} deleted successfully`);
          alert('Seat deleted successfully!');
        },
        error: (err) => {
          console.error('Error deleting seat:', err);
          alert('Failed to delete seat');
        }
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.currentSeat = { 
      id: 0, 
      seat_number: '', 
      status: 'available', 
      photo: '',
      has_power_outlet: false,
      has_monitor: false,
      is_near_window: false,
      is_accessible: false,
      seat_type: 'regular',
      time_slot: 'morning' // Reset to morning shift
    };
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentSeat.photo = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  saveSeat(form: any) {
    if (form.valid) {
      this.loading = true;
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('seat_number', this.currentSeat.seat_number);
      formData.append('status', this.currentSeat.status);
      formData.append('time_slot', this.currentSeat.time_slot || 'morning'); // Add time slot
      
      if (this.selectedFile) {
        formData.append('photo', this.selectedFile, this.selectedFile.name);
      }

      const request = this.isEditing 
        ? this.seatService.updateSeat(this.currentSeat.id, formData)
        : this.seatService.createSeat(formData);

      request.subscribe({
        next: (savedSeat) => {
          if (this.isEditing) {
            const index = this.seats.findIndex((s) => s.id === savedSeat.id);
            if (index !== -1) {
              this.seats[index] = savedSeat;
            }
            console.log('Seat updated successfully:', savedSeat);
            alert('Seat updated successfully!');
          } else {
            this.seats.push(savedSeat);
            console.log('Seat created successfully:', savedSeat);
            alert('Seat added successfully!');
          }
          this.closeModal();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error saving seat:', err);
          const errorMessage = err.error?.detail || err.error?.message || 'Failed to save seat';
          alert(`Error: ${errorMessage}`);
          this.loading = false;
        }
      });
    }
  }

  // Helper method to get seat photo URL
  getSeatPhoto(seat: Seat): string {
    if (seat.photo) {
      // If photo is a full URL, return as is
      if (seat.photo.startsWith('http')) {
        return seat.photo;
      }
      // If photo is a relative path, construct full URL
      return `${environment.backendUrl}${seat.photo}`;
    }
    // Default placeholder with better error handling
    return `https://picsum.photos/seed/seat-${seat.seat_number || seat.id}/400/300`;
  }

  // Handle image loading errors with better fallback
  onImageError(event: any, seat: Seat) {
    console.warn(`Failed to load image for seat ${seat.seat_number}, using fallback`);
    
    // Try multiple fallback strategies
    const fallbackUrl = `https://picsum.photos/seed/seat-${seat.seat_number || seat.id}/400/300`;
    
    // Set fallback image
    if (event.target) {
      event.target.src = fallbackUrl;
    }
    
    // Add error indicator to seat data
    seat.imageError = true;
    
    // Log the error for debugging
    console.error('Image load error details:', {
      seat: seat.seat_number,
      originalUrl: seat.photo,
      error: event,
      fallbackUrl: fallbackUrl
    });
  }
}
