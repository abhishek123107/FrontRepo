import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme: Theme = 'light';
  private themeSubject = new BehaviorSubject<Theme>(this.loadTheme());
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Toggle theme between light and dark
   */
  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set specific theme
   */
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.saveTheme(theme);
    this.applyTheme(theme);
    this.themeSubject.next(theme);
  }

  /**
   * Private: Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    const htmlElement = document.documentElement;

    if (theme === 'dark') {
      htmlElement.classList.add('dark-theme');
      htmlElement.classList.remove('light-theme');
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.add('light-theme');
      htmlElement.classList.remove('dark-theme');
      htmlElement.style.colorScheme = 'light';
    }
  }

  /**
   * Private: Save theme preference to localStorage
   */
  private saveTheme(theme: Theme): void {
    localStorage.setItem('theme-preference', theme);
  }

  /**
   * Private: Load theme from localStorage or system preference
   */
  private loadTheme(): Theme {
    const saved = localStorage.getItem('theme-preference') as Theme | null;

    if (saved) {
      return saved;
    }

    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    return 'light';
  }
}
