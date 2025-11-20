export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  tensorflowModelPath: '/assets/models/hoof-disease-model',
  thermalProcessing: {
    defaultColorScheme: 'rainbow' as const,
    minTemperature: 30,
    maxTemperature: 45,
    hotspotThreshold: 39
  },
  camera: {
    defaultFacingMode: 'environment' as const,
    idealWidth: 1920,
    idealHeight: 1080,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },
  storage: {
    databaseName: 'agrivue-db',
    version: 1,
    maxScansPerCow: 100,
    cacheExpirationDays: 30
  },
  features: {
    offlineMode: true,
    geotagging: true,
    exportData: true,
    cloudSync: false // Not implemented yet
  }
};
