import { notificationService } from './api';
import { toast } from 'sonner';

export const smsService = {
  sendSMS: async (to: string, message: string) => {
    try {
      console.log(`[SMS] Sending to ${to}: ${message}`);
      await notificationService.sendSMS(to, message);
      return true;
    } catch (error) {
      console.error("SMS failed", error);
      return false;
    }
  },

  notifyRequestUpdate: async (request: any, status: string) => {
    const phone = request.phone || "+93700000000"; 
    const message = `KDRU WMS: Request ${request.trackingId} status updated to ${status}.`;
    
    // Also send email if requester email exists
    if (request.requesterEmail) {
      try {
        await notificationService.sendSMS(request.requesterEmail, message); // The backend /sms endpoint actually handles email forwarding too
      } catch (e) {
        console.error("Email notify failed", e);
      }
    }

    return smsService.sendSMS(phone, message);
  }
};
