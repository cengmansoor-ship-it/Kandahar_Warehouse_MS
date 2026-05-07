/**
 * Mock Email Service for University Warehouse System
 */
import { toast } from 'sonner';
import api from './api';

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  recipientName: string;
}

class EmailService {
  /**
   * Logic to send a real email via the backend.
   */
  async sendEmail({ to, subject, body, recipientName }: EmailNotification): Promise<boolean> {
    console.log(`[EmailService] Sending email to ${to}...`);
    try {
      await api.post('/send-email', {
        to,
        subject,
        text: body,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #0F8F7F;">Kandahar University WMS Notification</h2>
          <p>${body.replace(/\n/g, '<br>')}</p>
        </div>`
      });
      
      toast.success(`Email notification sent to ${recipientName} (${to})`, {
        description: "Official record dispatched via University gateway.",
        duration: 5000,
      });
      return true;
    } catch (error) {
      console.error('Email Dispatch Error:', error);
      toast.error('Critical: Email gateway failure. Bill could not be sent.');
      return false;
    }
  }

  /**
   * Specifically for notifying item availability
   */
  async notifyItemArrival(personName: string, email: string, itemName: string) {
    const subject = `Item Available: ${itemName}`;
    const body = `Dear ${personName},\n\nYour requested item "${itemName}" has been received into the system. Please visit the warehouse as soon as possible to take it.\n\nBest regards,\nKandahar University Warehouse Team`;

    return this.sendEmail({
      to: email,
      subject,
      body,
      recipientName: personName
    });
  }
}

export const emailService = new EmailService();
