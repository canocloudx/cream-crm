/**
 * C.R.E.A.M. CRM API Tests
 * Basic smoke tests for the API endpoints
 */

describe('API Configuration', () => {
  test('package.json has correct test script', () => {
    const pkg = require('../package.json');
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts['test:ci']).toBeDefined();
  });

  test('jest.config.js exists and is valid', () => {
    const config = require('../jest.config.js');
    expect(config.testEnvironment).toBe('node');
    expect(config.coverageThreshold).toBeDefined();
  });
});

describe('Environment Configuration', () => {
  test('dotenv package is installed', () => {
    expect(() => require('dotenv')).not.toThrow();
  });

  test('express package is installed', () => {
    expect(() => require('express')).not.toThrow();
  });

  test('pg package is installed', () => {
    expect(() => require('pg')).not.toThrow();
  });
});

describe('Security Packages', () => {
  test('helmet package is installed', () => {
    expect(() => require('helmet')).not.toThrow();
  });

  test('express-rate-limit package is installed', () => {
    expect(() => require('express-rate-limit')).not.toThrow();
  });

  test('cors package is installed', () => {
    expect(() => require('cors')).not.toThrow();
  });
});

describe('Server Configuration', () => {
  test('server.js exists', () => {
    const fs = require('fs');
    const path = require('path');
    const serverPath = path.join(__dirname, '..', 'server.js');
    expect(fs.existsSync(serverPath)).toBe(true);
  });

  test('server.js contains API routes', () => {
    const fs = require('fs');
    const path = require('path');
    const serverPath = path.join(__dirname, '..', 'server.js');
    const content = fs.readFileSync(serverPath, 'utf8');
    
    // Check for essential API endpoints
    expect(content).toContain('/api/register');
    expect(content).toContain('/api/members');
    expect(content).toContain('/api/stats');
  });
});

describe('Docker Configuration', () => {
  test('Dockerfile exists', () => {
    const fs = require('fs');
    const path = require('path');
    const dockerfilePath = path.join(__dirname, '..', 'Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);
  });

  test('docker-compose.yml exists', () => {
    const fs = require('fs');
    const path = require('path');
    const composePath = path.join(__dirname, '..', 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);
  });
});

describe('CI/CD Configuration', () => {
  test('GitHub Actions workflow exists', () => {
    const fs = require('fs');
    const path = require('path');
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'ci.yml');
    expect(fs.existsSync(workflowPath)).toBe(true);
  });
});
