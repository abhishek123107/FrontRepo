import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Student {
  id: number;
  name: string;
  email: string;
  avatar: string;
  attendanceHours: number;
  totalBookings: number;
  consistencyScore: number;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css',
})
export class LeaderboardComponent implements OnInit {
  timeFilter: string = 'monthly';
  sortBy: string = 'attendance';
  topCount: string = '10';

  leaderboard: Student[] = [];
  totalStudents = 0;
  averageAttendance = 0;
  totalBookings = 0;
  topPerformer = '';

  ngOnInit() {
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    // Mock data - in real app, fetch from backend
    const allStudents: Student[] = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://via.placeholder.com/40x40?text=JD',
        attendanceHours: 156,
        totalBookings: 45,
        consistencyScore: 95,
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'https://via.placeholder.com/40x40?text=JS',
        attendanceHours: 142,
        totalBookings: 38,
        consistencyScore: 92,
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        avatar: 'https://via.placeholder.com/40x40?text=BJ',
        attendanceHours: 138,
        totalBookings: 42,
        consistencyScore: 88,
      },
      {
        id: 4,
        name: 'Alice Brown',
        email: 'alice@example.com',
        avatar: 'https://via.placeholder.com/40x40?text=AB',
        attendanceHours: 125,
        totalBookings: 35,
        consistencyScore: 90,
      },
      {
        id: 5,
        name: 'Charlie Wilson',
        email: 'charlie@example.com',
        avatar: 'https://via.placeholder.com/40x40?text=CW',
        attendanceHours: 118,
        totalBookings: 40,
        consistencyScore: 85,
      },
    ];

    // Apply time filter (mock - in real app, filter by date range)
    this.leaderboard = allStudents.slice(0, parseInt(this.topCount));

    this.sortLeaderboard();
    this.calculateStats();
  }

  sortLeaderboard() {
    this.leaderboard.sort((a, b) => {
      switch (this.sortBy) {
        case 'attendance':
          return b.attendanceHours - a.attendanceHours;
        case 'consistency':
          return b.consistencyScore - a.consistencyScore;
        case 'bookings':
          return b.totalBookings - a.totalBookings;
        default:
          return 0;
      }
    });
  }

  calculateStats() {
    this.totalStudents = this.leaderboard.length;
    this.averageAttendance = Math.round(
      this.leaderboard.reduce(
        (sum, student) => sum + student.attendanceHours,
        0
      ) / this.totalStudents
    );
    this.totalBookings = this.leaderboard.reduce(
      (sum, student) => sum + student.totalBookings,
      0
    );
    this.topPerformer = this.leaderboard[0]?.name || 'N/A';
  }
}
