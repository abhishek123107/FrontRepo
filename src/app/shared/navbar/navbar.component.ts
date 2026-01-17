import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { HelpChatComponent } from '../help-chat/help-chat.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [ ThemeToggleComponent, HelpChatComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  constructor(private router: Router) {}

  logout() {
    // TODO: Implement logout logic
    this.router.navigate(['/']);
  }
}
