import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // For authenticated users, use user ID for tracking
    const userId = req.user?.id;
    if (userId) {
      return `user-${userId}`;
    }
    // For unauthenticated users, use IP address
    return req.ip;
  }
}
