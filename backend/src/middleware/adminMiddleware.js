import { User, AdminSetting } from '../models/index.js';

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Check if user is super admin (first admin)
export const isSuperAdmin = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') {
      // Check if this is the first admin (super admin)
      const adminCount = await User.count({ where: { role: 'admin' } });
      const firstAdmin = await User.findOne({ 
        where: { role: 'admin' }, 
        order: [['createdAt', 'ASC']] 
      });
      
      if (firstAdmin && firstAdmin.id === req.user.id) {
        next();
      } else {
        res.status(403).json({ message: 'Super admin access required' });
      }
    } else {
      res.status(403).json({ message: 'Admin access required' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Log admin actions
export const logAdminAction = async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Log after response is sent
    if (res.statusCode < 400) { // Only log successful actions
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
        userAgent: req.get('User-Agent')
      };
      
      // Store in database or log file
      console.log('Admin Action:', JSON.stringify(action, null, 2));
      
      // Could also store in AdminLog model if created
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Validate admin permissions for specific operations
export const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Check if user has specific permission
      // You can implement a permissions system in database
      const permissions = {
        'manage_users': true,
        'manage_deposits': true,
        'manage_withdrawals': true,
        'manage_trades': true,
        'manage_market': true,
        'manage_settings': true,
        'view_reports': true
      };
      
      // Super admin has all permissions
      const adminCount = await User.count({ where: { role: 'admin' } });
      const firstAdmin = await User.findOne({ 
        where: { role: 'admin' }, 
        order: [['createdAt', 'ASC']] 
      });
      
      if (firstAdmin && firstAdmin.id === req.user.id) {
        return next();
      }
      
      // Check if admin has this permission
      if (permissions[permission]) {
        next();
      } else {
        res.status(403).json({ message: `Missing permission: ${permission}` });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

// Check maintenance mode
export const checkMaintenanceMode = async (req, res, next) => {
  try {
    const maintenanceMode = await AdminSetting.findByPk('maintenance_mode');
    
    if (maintenanceMode && maintenanceMode.value === 'true') {
      // Allow admins to bypass maintenance mode
      if (req.user && req.user.role === 'admin') {
        return next();
      }
      
      const maintenanceMessage = await AdminSetting.findByPk('maintenance_message');
      
      return res.status(503).json({ 
        message: maintenanceMessage?.value || 'Site is under maintenance. Please try again later.',
        maintenance: true
      });
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Validate IP whitelist for admin access
export const ipWhitelist = async (req, res, next) => {
  try {
    // Get whitelisted IPs from settings
    const whitelistSetting = await AdminSetting.findByPk('admin_ip_whitelist');
    
    if (whitelistSetting && whitelistSetting.value) {
      const whitelistedIPs = whitelistSetting.value.split(',').map(ip => ip.trim());
      
      // If whitelist is enabled and IP is not whitelisted
      if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(req.ip)) {
        return res.status(403).json({ message: 'Access from this IP is not allowed' });
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Rate limit admin actions based on sensitivity
export const adminActionLimiter = (req, res, next) => {
  const sensitiveActions = ['delete', 'update', 'create'];
  const isSensitive = sensitiveActions.some(action => 
    req.path.toLowerCase().includes(action) || req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE'
  );
  
  if (isSensitive) {
    // Add custom header for sensitive actions
    res.setHeader('X-Admin-Action', 'sensitive');
  }
  
  next();
};

// Validate admin session
export const validateAdminSession = async (req, res, next) => {
  try {
    // Check if admin session is valid and not expired
    // You can add additional checks like last activity time
    
    const lastActivity = await AdminSetting.findByPk(`admin_last_active_${req.user.id}`);
    
    if (lastActivity) {
      const lastActive = new Date(lastActivity.value);
      const now = new Date();
      const hoursSinceLastActive = (now - lastActive) / (1000 * 60 * 60);
      
      // Force re-login after 24 hours of inactivity
      if (hoursSinceLastActive > 24) {
        return res.status(401).json({ 
          message: 'Session expired due to inactivity. Please login again.' 
        });
      }
    }
    
    // Update last activity
    await AdminSetting.upsert({ 
      key: `admin_last_active_${req.user.id}`, 
      value: new Date().toISOString() 
    });
    
    next();
  } catch (error) {
    next();
  }
};