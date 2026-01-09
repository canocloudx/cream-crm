/**
 * C.R.E.A.M. CRM - Prometheus Metrics
 * Application metrics collection and exposure
 */

const promClient = require('prom-client');

// Create a Registry to hold all metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
promClient.collectDefaultMetrics({ 
  register,
  prefix: 'cream_'
});

// ============================================
// Custom Application Metrics
// ============================================

// HTTP Request Duration Histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'cream_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});
register.registerMetric(httpRequestDuration);

// HTTP Request Counter
const httpRequestsTotal = new promClient.Counter({
  name: 'cream_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestsTotal);

// Active Members Gauge
const activeMembers = new promClient.Gauge({
  name: 'cream_active_members_total',
  help: 'Total number of registered members'
});
register.registerMetric(activeMembers);

// Total Stamps Counter
const totalStamps = new promClient.Gauge({
  name: 'cream_total_stamps',
  help: 'Total stamps across all members'
});
register.registerMetric(totalStamps);

// Total Rewards Counter
const totalRewards = new promClient.Gauge({
  name: 'cream_total_rewards',
  help: 'Total rewards earned across all members'
});
register.registerMetric(totalRewards);

// Stamps Added Counter
const stampsAdded = new promClient.Counter({
  name: 'cream_stamps_added_total',
  help: 'Total stamps added',
  labelNames: ['source']
});
register.registerMetric(stampsAdded);

// Rewards Redeemed Counter
const rewardsRedeemed = new promClient.Counter({
  name: 'cream_rewards_redeemed_total',
  help: 'Total rewards redeemed'
});
register.registerMetric(rewardsRedeemed);

// New Registrations Counter
const newRegistrations = new promClient.Counter({
  name: 'cream_registrations_total',
  help: 'Total new member registrations',
  labelNames: ['source']
});
register.registerMetric(newRegistrations);

// Wallet Passes Generated Counter
const walletPassesGenerated = new promClient.Counter({
  name: 'cream_wallet_passes_generated_total',
  help: 'Total Apple Wallet passes generated'
});
register.registerMetric(walletPassesGenerated);

// Database Query Duration
const dbQueryDuration = new promClient.Histogram({
  name: 'cream_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});
register.registerMetric(dbQueryDuration);

// ============================================
// Middleware for tracking HTTP requests
// ============================================
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationSeconds = duration[0] + duration[1] / 1e9;
    
    // Normalize route for metrics (avoid high cardinality)
    let route = req.route ? req.route.path : req.path;
    // Replace dynamic IDs with placeholder
    route = route.replace(/CREAM-[A-Z0-9]+/gi, ':memberId');
    route = route.replace(/\/\d+/g, '/:id');
    
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode
    };
    
    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
  });
  
  next();
};

// ============================================
// Helper functions to update metrics
// ============================================
const updateMemberStats = async (pool) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_members,
        COALESCE(SUM(stamps), 0) as total_stamps,
        COALESCE(SUM(total_rewards), 0) as total_rewards
      FROM members
    `);
    
    const stats = result.rows[0];
    activeMembers.set(parseInt(stats.total_members));
    totalStamps.set(parseInt(stats.total_stamps));
    totalRewards.set(parseInt(stats.total_rewards));
  } catch (err) {
    console.error('Failed to update member stats metrics:', err.message);
  }
};

module.exports = {
  register,
  metricsMiddleware,
  updateMemberStats,
  // Export individual metrics for direct manipulation
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    activeMembers,
    totalStamps,
    totalRewards,
    stampsAdded,
    rewardsRedeemed,
    newRegistrations,
    walletPassesGenerated,
    dbQueryDuration
  }
};
