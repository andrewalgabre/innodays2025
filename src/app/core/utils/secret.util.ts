/**
 * Simple encoding/decoding utility for API keys
 * Note: This is obfuscation, NOT encryption. Keys are still accessible in browser.
 * For true security, use a backend proxy.
 */

export class SecretUtil {
  // Simple Base64 encoding with character shift
  static encode(value: string): string {
    // Convert to Base64
    const base64 = btoa(value);
    // Reverse the string
    const reversed = base64.split('').reverse().join('');
    // Add a simple prefix
    return `ENC_${reversed}`;
  }

  static decode(encoded: string): string {
    if (!encoded || !encoded.startsWith('ENC_')) {
      // If not encoded, return as-is (for backward compatibility)
      return encoded;
    }

    try {
      // Remove prefix
      const withoutPrefix = encoded.substring(4);
      // Reverse back
      const reversed = withoutPrefix.split('').reverse().join('');
      // Decode from Base64
      return atob(reversed);
    } catch (error) {
      console.error('Failed to decode secret:', error);
      return '';
    }
  }

  /**
   * Encode your API key for use in environment files
   * Usage: console.log(SecretUtil.encode('your-actual-api-key'))
   */
  static encodeForEnvironment(apiKey: string): string {
    return this.encode(apiKey);
  }
}
