import { ElementFingerprint } from './ElementFingerprint';

/**
 * Cached selector with success tracking
 */
export class CachedSelector {
  public readonly selector: string;
  public readonly fingerprint?: ElementFingerprint;
  public readonly timestamp: number;
  public successCount: number = 0;
  public failureCount: number = 0;

  constructor(selector: string, fingerprint?: ElementFingerprint) {
    this.selector = selector;
    this.fingerprint = fingerprint;
    this.timestamp = Date.now();
  }

  /**
   * Get current success rate
   */
  getCurrentSuccessRate(): number {
    const total = this.successCount + this.failureCount;
    return total === 0 ? 1.0 : this.successCount / total;
  }

  /**
   * Update success statistics
   */
  updateSuccess(success: boolean): void {
    if (success) {
      this.successCount++;
    } else {
      this.failureCount++;
    }
  }
}
