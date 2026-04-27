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
    const phone = "+93700000000"; // Mock target or from user profile
    const message = `KDRU WMS: Request ${request.trackingId} status updated to ${status}.`;
    return smsService.sendSMS(phone, message);
  }
};
