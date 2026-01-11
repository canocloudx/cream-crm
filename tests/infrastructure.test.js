/**
 * C.R.E.A.M. CRM Infrastructure Tests
 * Tests for monitoring, logging, metrics, and documentation modules
 */

const fs = require('fs');
const path = require('path');

describe('Monitoring Infrastructure', () => {
  
  // ============================================
  // LOGGER MODULE TESTS
  // ============================================
  describe('Logger Module', () => {
    test('logger.js exists', () => {
      const loggerPath = path.join(__dirname, '..', 'logger.js');
      expect(fs.existsSync(loggerPath)).toBe(true);
    });

    test('logger module loads without error', () => {
      expect(() => require('../logger')).not.toThrow();
    });

    test('logger has required methods', () => {
      const logger = require('../logger');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });

    test('logger has requestLogger middleware', () => {
      const logger = require('../logger');
      expect(typeof logger.requestLogger).toBe('function');
    });

    test('winston package is installed', () => {
      expect(() => require('winston')).not.toThrow();
    });

    test('winston-loki package is installed', () => {
      expect(() => require('winston-loki')).not.toThrow();
    });
  });

  // ============================================
  // METRICS MODULE TESTS
  // ============================================
  describe('Metrics Module', () => {
    test('metrics.js exists', () => {
      const metricsPath = path.join(__dirname, '..', 'metrics.js');
      expect(fs.existsSync(metricsPath)).toBe(true);
    });

    test('metrics module loads without error', () => {
      expect(() => require('../metrics')).not.toThrow();
    });

    test('metrics has register export', () => {
      const metrics = require('../metrics');
      expect(metrics.register).toBeDefined();
    });

    test('metrics has middleware export', () => {
      const metrics = require('../metrics');
      expect(typeof metrics.metricsMiddleware).toBe('function');
    });

    test('metrics has custom metrics defined', () => {
      const metrics = require('../metrics');
      expect(metrics.metrics).toBeDefined();
      expect(metrics.metrics.httpRequestsTotal).toBeDefined();
      expect(metrics.metrics.httpRequestDuration).toBeDefined();
    });

    test('prom-client package is installed', () => {
      expect(() => require('prom-client')).not.toThrow();
    });
  });

  // ============================================
  // SWAGGER MODULE TESTS
  // ============================================
  describe('Swagger Module', () => {
    test('swagger.js exists', () => {
      const swaggerPath = path.join(__dirname, '..', 'swagger.js');
      expect(fs.existsSync(swaggerPath)).toBe(true);
    });

    test('swagger module loads without error', () => {
      expect(() => require('../swagger')).not.toThrow();
    });

    test('swagger has specs export', () => {
      const swagger = require('../swagger');
      expect(swagger.specs).toBeDefined();
    });

    test('swagger has swaggerUi export', () => {
      const swagger = require('../swagger');
      expect(swagger.swaggerUi).toBeDefined();
    });

    test('swagger specs contain API info', () => {
      const swagger = require('../swagger');
      expect(swagger.specs.openapi).toBe('3.0.0');
      expect(swagger.specs.info).toBeDefined();
      expect(swagger.specs.info.title).toContain('C.R.E.A.M.');
    });

    test('swagger-jsdoc package is installed', () => {
      expect(() => require('swagger-jsdoc')).not.toThrow();
    });

    test('swagger-ui-express package is installed', () => {
      expect(() => require('swagger-ui-express')).not.toThrow();
    });
  });

  // ============================================
  // SERVER MONITORING ENDPOINTS
  // ============================================
  describe('Server Monitoring Endpoints', () => {
    test('server.js contains /api/monitoring endpoint', () => {
      const serverPath = path.join(__dirname, '..', 'server.js');
      const content = fs.readFileSync(serverPath, 'utf8');
      expect(content).toContain('/api/monitoring');
    });

    test('server.js contains /api/health endpoint', () => {
      const serverPath = path.join(__dirname, '..', 'server.js');
      const content = fs.readFileSync(serverPath, 'utf8');
      expect(content).toContain('/api/health');
    });

    test('server.js contains /metrics endpoint', () => {
      const serverPath = path.join(__dirname, '..', 'server.js');
      const content = fs.readFileSync(serverPath, 'utf8');
      expect(content).toContain('/metrics');
    });

    test('server.js contains /api-docs endpoint', () => {
      const serverPath = path.join(__dirname, '..', 'server.js');
      const content = fs.readFileSync(serverPath, 'utf8');
      expect(content).toContain('/api-docs');
    });
  });
});

describe('Monitoring Configuration Files', () => {
  
  // ============================================
  // PROMETHEUS CONFIGURATION
  // ============================================
  describe('Prometheus Configuration', () => {
    test('prometheus.yml exists', () => {
      const promPath = path.join(__dirname, '..', 'monitoring', 'prometheus.yml');
      expect(fs.existsSync(promPath)).toBe(true);
    });

    test('prometheus.yml has correct scrape config', () => {
      const promPath = path.join(__dirname, '..', 'monitoring', 'prometheus.yml');
      const content = fs.readFileSync(promPath, 'utf8');
      expect(content).toContain('scrape_configs');
      expect(content).toContain('cream-app');
    });
  });

  // ============================================
  // LOKI CONFIGURATION
  // ============================================
  describe('Loki Configuration', () => {
    test('loki-config.yml exists', () => {
      const lokiPath = path.join(__dirname, '..', 'monitoring', 'loki-config.yml');
      expect(fs.existsSync(lokiPath)).toBe(true);
    });
  });

  // ============================================
  // GRAFANA CONFIGURATION
  // ============================================
  describe('Grafana Configuration', () => {
    test('grafana datasources.yml exists', () => {
      const dsPath = path.join(__dirname, '..', 'monitoring', 'grafana', 'provisioning', 'datasources', 'datasources.yml');
      expect(fs.existsSync(dsPath)).toBe(true);
    });

    test('grafana dashboards.yml exists', () => {
      const dashPath = path.join(__dirname, '..', 'monitoring', 'grafana', 'provisioning', 'dashboards', 'dashboards.yml');
      expect(fs.existsSync(dashPath)).toBe(true);
    });

    test('grafana dashboard JSON exists', () => {
      const jsonPath = path.join(__dirname, '..', 'monitoring', 'grafana', 'provisioning', 'dashboards', 'cream-overview.json');
      expect(fs.existsSync(jsonPath)).toBe(true);
    });

    test('grafana dashboard JSON is valid', () => {
      const jsonPath = path.join(__dirname, '..', 'monitoring', 'grafana', 'provisioning', 'dashboards', 'cream-overview.json');
      expect(() => JSON.parse(fs.readFileSync(jsonPath, 'utf8'))).not.toThrow();
    });
  });
});

describe('Cloud Backup Scripts', () => {
  test('backup-to-cloud.sh exists', () => {
    const backupPath = path.join(__dirname, '..', 'scripts', 'backup-to-cloud.sh');
    expect(fs.existsSync(backupPath)).toBe(true);
  });

  test('restore-from-cloud.sh exists', () => {
    const restorePath = path.join(__dirname, '..', 'scripts', 'restore-from-cloud.sh');
    expect(fs.existsSync(restorePath)).toBe(true);
  });

  test('backup script is executable (has shebang)', () => {
    const backupPath = path.join(__dirname, '..', 'scripts', 'backup-to-cloud.sh');
    const content = fs.readFileSync(backupPath, 'utf8');
    expect(content.startsWith('#!/bin/bash')).toBe(true);
  });

  test('backup script uses R2 environment variables', () => {
    const backupPath = path.join(__dirname, '..', 'scripts', 'backup-to-cloud.sh');
    const content = fs.readFileSync(backupPath, 'utf8');
    expect(content).toContain('R2_ACCOUNT_ID');
    expect(content).toContain('R2_BUCKET');
  });
});

describe('Docker Compose Monitoring Services', () => {
  test('docker-compose.yml contains prometheus service', () => {
    const composePath = path.join(__dirname, '..', 'docker-compose.yml');
    const content = fs.readFileSync(composePath, 'utf8');
    expect(content).toContain('prometheus:');
    expect(content).toContain('prom/prometheus');
  });

  test('docker-compose.yml contains grafana service', () => {
    const composePath = path.join(__dirname, '..', 'docker-compose.yml');
    const content = fs.readFileSync(composePath, 'utf8');
    expect(content).toContain('grafana:');
    expect(content).toContain('grafana/grafana');
  });

  test('docker-compose.yml contains loki service', () => {
    const composePath = path.join(__dirname, '..', 'docker-compose.yml');
    const content = fs.readFileSync(composePath, 'utf8');
    expect(content).toContain('loki:');
    expect(content).toContain('grafana/loki');
  });

  test('docker-compose.yml contains cloud-backup service', () => {
    const composePath = path.join(__dirname, '..', 'docker-compose.yml');
    const content = fs.readFileSync(composePath, 'utf8');
    expect(content).toContain('cloud-backup:');
  });
});

describe('Frontend Monitoring Page', () => {
  test('index.html contains monitoring in settings', () => {
    const indexPath = path.join(__dirname, '..', 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');
    expect(content).toContain('openMonitoringModal');
    expect(content).toContain('monitor_heart');
  });

  test('index.html contains monitoring modal', () => {
    const indexPath = path.join(__dirname, '..', 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');
    expect(content).toContain('monitoringModalOverlay');
    expect(content).toContain('System Monitoring');
  });

  test('app.js contains loadMonitoringData function', () => {
    const appPath = path.join(__dirname, '..', 'app.js');
    const content = fs.readFileSync(appPath, 'utf8');
    expect(content).toContain('loadMonitoringData');
    expect(content).toContain('updateMonitoringUI');
  });

  test('styles.css contains monitoring styles', () => {
    const cssPath = path.join(__dirname, '..', 'styles.css');
    const content = fs.readFileSync(cssPath, 'utf8');
    expect(content).toContain('.monitoring-status-grid');
    expect(content).toContain('.monitoring-card');
  });
});

// ============================================
// AUTHENTICATION & ROUTING TESTS
// ============================================

describe('Authentication System', () => {
  test('login.html exists', () => {
    const loginPath = path.join(__dirname, '..', 'login.html');
    expect(fs.existsSync(loginPath)).toBe(true);
  });

  test('login.html contains login form', () => {
    const loginPath = path.join(__dirname, '..', 'login.html');
    const content = fs.readFileSync(loginPath, 'utf8');
    expect(content).toContain('id="loginForm"');
    expect(content).toContain('id="email"');
    expect(content).toContain('id="password"');
  });

  test('login.html contains staff login API call', () => {
    const loginPath = path.join(__dirname, '..', 'login.html');
    const content = fs.readFileSync(loginPath, 'utf8');
    expect(content).toContain('/api/staff/login');
  });

  test('login.html contains set password functionality', () => {
    const loginPath = path.join(__dirname, '..', 'login.html');
    const content = fs.readFileSync(loginPath, 'utf8');
    expect(content).toContain('setPasswordModal');
    expect(content).toContain('/api/staff/set-password');
  });

  test('app.js contains auth check', () => {
    const appPath = path.join(__dirname, '..', 'app.js');
    const content = fs.readFileSync(appPath, 'utf8');
    expect(content).toContain('checkAuth');
    expect(content).toContain('staffSession');
    expect(content).toContain('/login.html');
  });

  test('server.js contains staff login endpoint', () => {
    const serverPath = path.join(__dirname, '..', 'server.js');
    const content = fs.readFileSync(serverPath, 'utf8');
    expect(content).toContain('/api/staff/login');
    expect(content).toContain('bcrypt.compare');
  });

  test('server.js contains set-password endpoint', () => {
    const serverPath = path.join(__dirname, '..', 'server.js');
    const content = fs.readFileSync(serverPath, 'utf8');
    expect(content).toContain('/api/staff/set-password');
  });
});

describe('Hash-Based Routing', () => {
  test('app.js contains hash routing function', () => {
    const appPath = path.join(__dirname, '..', 'app.js');
    const content = fs.readFileSync(appPath, 'utf8');
    expect(content).toContain('getPageFromHash');
    expect(content).toContain('window.location.hash');
  });

  test('app.js handles hashchange event', () => {
    const appPath = path.join(__dirname, '..', 'app.js');
    const content = fs.readFileSync(appPath, 'utf8');
    expect(content).toContain('hashchange');
  });

  test('app.js updates hash in showPage', () => {
    const appPath = path.join(__dirname, '..', 'app.js');
    const content = fs.readFileSync(appPath, 'utf8');
    expect(content).toContain("window.location.hash = '#' + pageId");
  });

  test('login.html redirects to index.html with hash', () => {
    const loginPath = path.join(__dirname, '..', 'login.html');
    const content = fs.readFileSync(loginPath, 'utf8');
    expect(content).toContain('/index.html#');
  });
});

describe('SPA Routes in Server', () => {
  test('server.js contains SPA routes for pages', () => {
    const serverPath = path.join(__dirname, '..', 'server.js');
    const content = fs.readFileSync(serverPath, 'utf8');
    expect(content).toContain('/members');
    expect(content).toContain('/transactions');
    expect(content).toContain('/settings');
  });

  test('server.js contains login route', () => {
    const serverPath = path.join(__dirname, '..', 'server.js');
    const content = fs.readFileSync(serverPath, 'utf8');
    expect(content).toContain("app.get('/login'");
  });
});

describe('Sidebar Logo Fix', () => {
  test('styles.css contains logo collapse rule', () => {
    const cssPath = path.join(__dirname, '..', 'styles.css');
    const content = fs.readFileSync(cssPath, 'utf8');
    expect(content).toContain('.sidebar.collapsed .logo-img');
  });
});
