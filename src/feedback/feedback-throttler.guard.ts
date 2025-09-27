import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class FeedbackThrottlerGuard extends ThrottlerGuard {
  private readonly requestTimes = new Map<string, number>();
  private readonly RATE_LIMIT_TTL = 60000; // 1 minute in milliseconds
  private readonly RATE_LIMIT_COUNT = 1; // 1 request per minute

  // Method to clear rate limiter state (useful for testing)
  public clearRateLimitState(): void {
    this.requestTimes.clear();
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // This guard runs after JWT authentication, so req.user should be available
    const userId = req.user?.id;
    if (userId) {
      const tracker = `feedback-user-${userId}`;
      console.log(`Feedback rate limiting tracker for user ${userId}: ${tracker}`);
      return tracker;
    }
    // Fallback to IP if no user (shouldn't happen with JWT guard)
    const ipTracker = req.ip;
    console.log(`Feedback rate limiting tracker for IP (fallback): ${ipTracker}`);
    return ipTracker;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip rate limiting in test environment
    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    // Only apply throttling to POST requests (feedback creation)
    const request = context.switchToHttp().getRequest();
    if (request.method !== 'POST') {
      return true; // Allow all non-POST requests
    }

    const tracker = await this.getTracker(request);
    const currentTime = Date.now();
    
    // Clean up old entries first
    this.cleanupOldEntries();
    
    // Check if user has made a request recently
    const lastRequestTime = this.requestTimes.get(tracker);
    
    if (lastRequestTime) {
      const timeDifference = currentTime - lastRequestTime;
      const timeDifferenceSeconds = Math.round(timeDifference / 1000);
      
      console.log(`Checking rate limit for ${tracker}. Last request: ${new Date(lastRequestTime)}, Current: ${new Date(currentTime)}, Difference: ${timeDifferenceSeconds} seconds`);
      
      if (timeDifference < this.RATE_LIMIT_TTL) {
        const remainingSeconds = Math.ceil((this.RATE_LIMIT_TTL - timeDifference) / 1000);
        console.log(`Rate limit exceeded for ${tracker}. Please wait ${remainingSeconds} more seconds.`);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too Many Requests - Rate limit exceeded (1 feedback per minute per user). Please wait ${remainingSeconds} more seconds.`,
            error: 'Too Many Requests',
            retryAfter: remainingSeconds
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }
    
    // Record this request
    this.requestTimes.set(tracker, currentTime);
    console.log(`Request allowed for ${tracker} at ${new Date(currentTime)}`);
    
    return true;
  }

  private cleanupOldEntries(): void {
    const currentTime = Date.now();
    const oneMinuteAgo = currentTime - this.RATE_LIMIT_TTL;
    
    for (const [key, timestamp] of this.requestTimes.entries()) {
      if (timestamp < oneMinuteAgo) {
        this.requestTimes.delete(key);
        console.log(`Cleaned up old entry for ${key}`);
      }
    }
  }
}
