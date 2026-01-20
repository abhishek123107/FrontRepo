export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export class ErrorHandler {
  /**
   * Parse backend API errors and return user-friendly messages
   */
  static parseError(error: any): string {
    // Handle different error structures
    if (typeof error === 'string') {
      return error;
    }

    // Handle HTTP error response
    if (error?.error) {
      return this.parseErrorResponse(error.error);
    }

    // Handle direct error object
    if (error?.message) {
      return this.parseErrorResponse(error);
    }

    // Default fallback
    return 'An unexpected error occurred. Please try again.';
  }

  private static parseErrorResponse(errorResponse: any): string {
    // Handle field-specific errors (like email already exists)
    if (typeof errorResponse === 'object') {
      // Check for common Django REST Framework error patterns
      const fieldErrors = this.extractFieldErrors(errorResponse);
      if (fieldErrors.length > 0) {
        return fieldErrors.join(', ');
      }

      // Check for non-field errors
      if (errorResponse.non_field_errors) {
        return Array.isArray(errorResponse.non_field_errors) 
          ? errorResponse.non_field_errors.join(', ')
          : errorResponse.non_field_errors;
      }

      // Check for detail field (common in DRF)
      if (errorResponse.detail) {
        return this.getFriendlyMessage(errorResponse.detail);
      }

      // Check for email/username specific errors
      if (errorResponse.email) {
        return this.getEmailErrorMessage(errorResponse.email);
      }

      if (errorResponse.username) {
        return this.getUsernameErrorMessage(errorResponse.username);
      }

      if (errorResponse.password) {
        return this.getPasswordErrorMessage(errorResponse.password);
      }
    }

    // Handle string errors
    if (typeof errorResponse === 'string') {
      return this.getFriendlyMessage(errorResponse);
    }

    return 'Invalid request. Please check your input and try again.';
  }

  private static extractFieldErrors(errorResponse: any): string[] {
    const errors: string[] = [];
    
    Object.keys(errorResponse).forEach(field => {
      if (field !== 'non_field_errors' && field !== 'detail') {
        const fieldError = errorResponse[field];
        const friendlyMessage = this.getFieldSpecificErrorMessage(field, fieldError);
        if (friendlyMessage) {
          errors.push(friendlyMessage);
        }
      }
    });

    return errors;
  }

  private static getFieldSpecificErrorMessage(field: string, error: any): string {
    const errorText = Array.isArray(error) ? error[0] : error;
    
    switch (field) {
      case 'email':
        return this.getEmailErrorMessage(errorText);
      case 'username':
        return this.getUsernameErrorMessage(errorText);
      case 'password':
        return this.getPasswordErrorMessage(errorText);
      case 'phone':
        return this.getPhoneErrorMessage(errorText);
      default:
        return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${errorText}`;
    }
  }

  private static getEmailErrorMessage(error: string): string {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('already exist') || lowerError.includes('unique')) {
      return 'Email already exists. Please use a different email or try logging in.';
    }
    
    if (lowerError.includes('invalid') || lowerError.includes('valid email')) {
      return 'Please enter a valid email address.';
    }
    
    if (lowerError.includes('required')) {
      return 'Email is required.';
    }
    
    return `Email: ${error}`;
  }

  private static getUsernameErrorMessage(error: string): string {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('already exist') || lowerError.includes('unique')) {
      return 'Username already exists. Please choose a different username.';
    }
    
    if (lowerError.includes('required')) {
      return 'Username is required.';
    }
    
    if (lowerError.includes('too short') || lowerError.includes('minimum')) {
      return 'Username must be at least 3 characters long.';
    }
    
    return `Username: ${error}`;
  }

  private static getPasswordErrorMessage(error: string): string {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('too short') || lowerError.includes('minimum')) {
      return 'Password must be at least 8 characters long.';
    }
    
    if (lowerError.includes('required')) {
      return 'Password is required.';
    }
    
    if (lowerError.includes('common') || lowerError.includes('too common')) {
      return 'Password is too common. Please choose a more secure password.';
    }
    
    if (lowerError.includes('numeric')) {
      return 'Password cannot be entirely numeric.';
    }
    
    return `Password: ${error}`;
  }

  private static getPhoneErrorMessage(error: string): string {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('invalid') || lowerError.includes('format')) {
      return 'Please enter a valid phone number.';
    }
    
    if (lowerError.includes('required')) {
      return 'Phone number is required.';
    }
    
    return `Phone: ${error}`;
  }

  private static getFriendlyMessage(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Authentication errors
    if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('no active account')) {
      return 'Invalid email/phone or password. Please check your credentials and try again.';
    }
    
    if (lowerMessage.includes('account not found') || lowerMessage.includes('user not found')) {
      return 'Account not found. Please check your email/phone or sign up for a new account.';
    }
    
    if (lowerMessage.includes('email not verified')) {
      return 'Please verify your email address before logging in.';
    }
    
    if (lowerMessage.includes('account disabled')) {
      return 'Your account has been disabled. Please contact support.';
    }
    
    // Registration errors
    if (lowerMessage.includes('user with this email already exists')) {
      return 'An account with this email already exists. Please try logging in or use a different email.';
    }
    
    if (lowerMessage.includes('user with this username already exists')) {
      return 'This username is already taken. Please choose a different username.';
    }
    
    // General errors
    if (lowerMessage.includes('permission denied') || lowerMessage.includes('forbidden')) {
      return 'You do not have permission to perform this action.';
    }
    
    if (lowerMessage.includes('not found')) {
      return 'The requested resource was not found.';
    }
    
    if (lowerMessage.includes('server error') || lowerMessage.includes('internal server error')) {
      return 'Server error occurred. Please try again later.';
    }
    
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    return message;
  }
}
