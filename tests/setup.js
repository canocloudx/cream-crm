// Test setup file - runs before all tests
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
    // Generate a unique test member ID
    generateTestMemberId: () => `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

    // Wait helper
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Cleanup after all tests
afterAll(async () => {
    // Close any open handles
    await new Promise(resolve => setTimeout(resolve, 500));
});
