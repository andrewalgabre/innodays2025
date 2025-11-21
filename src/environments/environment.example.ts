// Example environment configuration for development
// Copy this file to environment.ts and add your API keys
export const environment = {
  production: false,
  anthropicApiKey: 'your-anthropic-api-key-here',
  geminiApiKey: 'your-gemini-api-key-here',
  geminiProjectId: 'your-gemini-project-id-here',
  geminiLocation: 'us-central1',
  gcs: {
    apiKey: 'your-google-storage-api-key-here',
    bucketName: 'your-google-storage-bucket-name-here',
  }
};
