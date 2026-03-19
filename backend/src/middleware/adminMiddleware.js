import { User, AdminSetting } from '../models/index.js';

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ message: 'Admin access required' });
};

export const isSuperAdmin = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      const firstAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
      if (firstAdmin && firstAdmin.id === req.user.id) next();
      else res.status(403).json({ message: 'Super admin access required' });
    } else {
      res.status(403).json({ message: 'Admin access required' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logAdminAction = async (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode < 400) {
      const action = {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body,
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      };
      console.log('Admin Action:', JSON.stringify(action, null, 2));
    }
    return originalJson.call(this, data);
  };
  next();
};

export const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const permissions = {
        'manage_users': true,
        'manage_deposits': true,
        'manage_withdrawals': true,
        'manage_trades': true,
        'manage_market': true,
        'manage_settings': true,
        'view_reports': true,
      };
      const adminCount = await User.countDocuments({ role: 'admin' });
      const firstAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
      if (firstAdmin && firstAdmin.id === req.user.id) return next();
      if (permissions[permission]) next();
      else res.status(403).json({ message: `Missing permission: ${permission}` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

export const checkMaintenanceMode = async (req, res, next) => {
  try {
    const maintenanceMode = await AdminSetting.findOne({ key: 'maintenance_mode' });
    if (maintenanceMode && maintenanceMode.value === 'true') {
      if (req.user && req.user.role === 'admin') return next();
      const maintenanceMessage = await AdminSetting.findOne({ key: 'maintenance_message' });
      return res.status(503).json({ message: maintenanceMessage?.value || 'Site is under maintenance. Please try again later.', maintenance: true });
    }
    next();
  } catch (error) {
    next();
  }
};

export const ipWhitelist = async (req, res, next) => {
  try {
    const whitelistSetting = await AdminSetting.findOne({ key: 'admin_ip_whitelist' });
    if (whitelistSetting && whitelistSetting.value) {
      const whitelistedIPs = whitelistSetting.value.split(',').map(ip => ip.trim());
      if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(req.ip)) {
        return res.status(403).json({ message: 'Access from this IP is not allowed' });
      }
    }
    next();
  } catch (error) {
    next();
  }
};

export const adminActionLimiter = (req, res, next) => {
  const sensitiveActions = ['delete', 'update', 'create'];
  const isSensitive = sensitiveActions.some(action => req.path.toLowerCase().includes(action) || ['POST', 'PUT', 'DELETE'].includes(req.method));
  if (isSensitive) res.setHeader('X-Admin-Action', 'sensitive');
  next();
};

export const validateAdminSession = async (req, res, next) => {
  try {
    const lastActivity = await AdminSetting.findOne({ key: `admin_last_active_${req.user.id}` });
    if (lastActivity) {
      const lastActive = new Date(lastActivity.value);
      const now = new Date();
      const hoursSinceLastActive = (now - lastActive) / (1000 * 60 * 60);
      if (hoursSinceLastActive > 24) {
        return res.status(401).json({ message: 'Session expired due to inactivity. Please login again.' });
      }
    }

    await AdminSetting.findOneAndUpdate(
      { key: `admin_last_active_${req.user.id}` },
      { value: new Date().toISOString() },
      { upsert: true, new: true }
    );

    next();
  } catch (error) {
    next();
  }
};
