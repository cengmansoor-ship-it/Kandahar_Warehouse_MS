/**
 * Mock Email Service for University Warehouse System
 */
import { toast } from 'sonner';

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  recipientName: string;
}

class EmailService {
  /**
   * Logic to simulate sending an email.
   * In production, this would call a backend endpoint that uses SendGrid, Nodemailer, etc.
   */
  async sendEmail({ to, subject, body, recipientName }: EmailNotification): Promise<boolean> {
    console.log(`[EmailService] Sending email to ${to}...`);
    console.log(`[Subject] ${subject}`);
    console.log(`[Body] ${body}`);

    return new Promise((resolve) => {
      setTimeout(() => {
        toast.success(`Email notification sent to ${recipientName} (${to})`, {
          description: "Item availability confirmation forwarded.",
          duration: 5000,
        });
        resolve(true);
      }, 1500);
    });
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
