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
  currentSeat: Seat = { id: 0, number: 0, status: 'available', photo: '' };
  selectedFile: File | null = null;
  loading = false;
  error: string | null = null;

  constructor(private seatService: SeatManagementService) {}

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
    this.currentSeat = { id: 0, number: 0, status: 'available', photo: '' };
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
    if (confirm(`Are you sure you want to delete Seat ${seat.number}?`)) {
      this.seatService.deleteSeat(seat.id).subscribe({
        next: () => {
          this.seats = this.seats.filter((s) => s.id !== seat.id);
          console.log(`Seat ${seat.number} deleted successfully`);
          alert('Seat deleted successfully!');
        },
        error: (err) => {
          console.error('Error deleting seat:', err);
          alert('Failed to delete seat. Please try again.');
        }
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.currentSeat = { id: 0, number: 0, status: 'available', photo: '' };
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
      formData.append('number', this.currentSeat.number.toString());
      formData.append('status', this.currentSeat.status);
      
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
    // Default placeholder
    return `https://picsum.photos/400/300?random=${seat.number}`;
  }

  // Handle image loading errors
  onImageError(event: any, seat: Seat) {
    console.warn(`Failed to load image for seat ${seat.number}, using placeholder`);
    event.target.src = `https://picsum.photos/400/300?random=${seat.number}`;
  }
}
