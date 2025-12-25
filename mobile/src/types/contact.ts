export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface ContactSubmission extends ContactFormData {
  timestamp: Date;
  userId?: string;
}

