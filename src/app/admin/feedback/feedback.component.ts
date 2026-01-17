import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

interface Feedback {
  id: number;
  studentName: string;
  rating: number;
  comment: string;
  date: Date;
  tags: string[];
}

interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}

interface IssueSuggestion {
  text: string;
  count: number;
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css',
})
export class FeedbackComponent implements OnInit {
  totalFeedback = 0;
  averageRating = 0;
  positiveFeedback = 0;
  recentFeedback = 0;
  filter: string = 'all';

  ratingDistribution: RatingDistribution[] = [];
  allFeedback: Feedback[] = [];
  filteredFeedback: Feedback[] = [];

  commonIssues: IssueSuggestion[] = [
    { text: 'WiFi connectivity issues', count: 15 },
    { text: 'Limited seating during peak hours', count: 12 },
    { text: 'Book availability', count: 8 },
    { text: 'Air conditioning problems', count: 6 },
  ];

  topSuggestions: IssueSuggestion[] = [
    { text: 'Extend library hours', count: 20 },
    { text: 'Add more study rooms', count: 18 },
    { text: 'Improve WiFi speed', count: 16 },
    { text: 'Add coffee vending machine', count: 14 },
  ];

  ngOnInit() {
    this.loadFeedback();
    this.calculateStats();
  }

  loadFeedback() {
    // Mock data - in real app, fetch from backend
    this.allFeedback = [
      {
        id: 1,
        studentName: 'John Doe',
        rating: 5,
        comment:
          'Excellent library with great facilities. The staff is very helpful and the environment is perfect for studying.',
        date: new Date('2024-01-15T14:30:00'),
        tags: ['facilities', 'staff', 'environment'],
      },
      {
        id: 2,
        studentName: 'Jane Smith',
        rating: 4,
        comment:
          'Good library overall, but WiFi could be better during peak hours.',
        date: new Date('2024-01-14T10:15:00'),
        tags: ['wifi', 'peak-hours'],
      },
      {
        id: 3,
        studentName: 'Bob Johnson',
        rating: 3,
        comment:
          'Decent place to study, but gets crowded. Need more seating options.',
        date: new Date('2024-01-13T16:45:00'),
        tags: ['crowded', 'seating'],
      },
      {
        id: 4,
        studentName: 'Alice Brown',
        rating: 2,
        comment:
          'WiFi is very slow and unreliable. Makes it difficult to work.',
        date: new Date('2024-01-12T11:20:00'),
        tags: ['wifi', 'connectivity'],
      },
      {
        id: 5,
        studentName: 'Charlie Wilson',
        rating: 5,
        comment:
          'Love the quiet atmosphere and helpful staff. Perfect for focused study.',
        date: new Date('2024-01-11T13:10:00'),
        tags: ['atmosphere', 'staff', 'study'],
      },
    ];
    this.setFilter('all');
  }

  calculateStats() {
    this.totalFeedback = this.allFeedback.length;
    this.averageRating =
      this.allFeedback.reduce((sum, fb) => sum + fb.rating, 0) /
      this.totalFeedback;
    this.positiveFeedback = Math.round(
      (this.allFeedback.filter((fb) => fb.rating >= 4).length /
        this.totalFeedback) *
        100
    );

    // Recent feedback (this month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.recentFeedback = this.allFeedback.filter(
      (fb) => fb.date >= startOfMonth
    ).length;

    // Rating distribution
    this.ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
      const count = this.allFeedback.filter((fb) => fb.rating === stars).length;
      return {
        stars,
        count,
        percentage: Math.round((count / this.totalFeedback) * 100),
      };
    });
  }

  setFilter(filterType: string) {
    this.filter = filterType;
    switch (filterType) {
      case 'positive':
        this.filteredFeedback = this.allFeedback.filter((fb) => fb.rating >= 4);
        break;
      case 'neutral':
        this.filteredFeedback = this.allFeedback.filter(
          (fb) => fb.rating === 3
        );
        break;
      case 'negative':
        this.filteredFeedback = this.allFeedback.filter((fb) => fb.rating <= 2);
        break;
      default:
        this.filteredFeedback = [...this.allFeedback];
    }
  }
}
