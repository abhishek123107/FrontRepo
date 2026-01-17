import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Message {
  sender: 'user' | 'admin';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-help-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './help-chat.component.html',
  styleUrl: './help-chat.component.css',
})
export class HelpChatComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isOpen = false;
  newMessage = '';
  messages: Message[] = [
    {
      sender: 'admin',
      text: 'Hello! How can I help you today?',
      timestamp: new Date(),
    },
  ];

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  closeChat() {
    this.isOpen = false;
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({
        sender: 'user',
        text: this.newMessage,
        timestamp: new Date(),
      });
      this.newMessage = '';

      // Simulate admin response
      setTimeout(() => {
        this.messages.push({
          sender: 'admin',
          text: 'Thank you for your message. An admin will respond shortly.',
          timestamp: new Date(),
        });
        this.scrollToBottom();
      }, 1000);

      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    });
  }
}
