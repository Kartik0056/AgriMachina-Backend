const PERMISSIONS = {
  // Products
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  PRODUCT_DELETE: 'PRODUCT_DELETE',
  PRODUCT_IMPORT: 'PRODUCT_IMPORT',
  PRODUCT_EXPORT: 'PRODUCT_EXPORT',
  
  // Inventory
  INVENTORY_UPDATE: 'INVENTORY_UPDATE',
  
  // Orders
  ORDER_VIEW: 'ORDER_VIEW',
  ORDER_UPDATE: 'ORDER_UPDATE',
  
  // Customers
  CUSTOMER_VIEW: 'CUSTOMER_VIEW',
  
  // Reviews
  REVIEW_MODERATE: 'REVIEW_MODERATE',
  
  // Marketing & SEO
  COUPON_MANAGE: 'COUPON_MANAGE',
  SEO_MANAGE: 'SEO_MANAGE',
  
  // Administration
  SETTINGS_MANAGE: 'SETTINGS_MANAGE',
  ADMIN_MANAGE: 'ADMIN_MANAGE',
  AUDIT_VIEW: 'AUDIT_VIEW'
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    description: 'Full system access with all administrative privileges',
    permissions: ALL_PERMISSIONS
  },
  ADMIN: {
    name: 'ADMIN',
    description: 'Standard administrator with full product, order, review, and inventory access',
    permissions: [
      PERMISSIONS.PRODUCT_CREATE,
      PERMISSIONS.PRODUCT_UPDATE,
      PERMISSIONS.PRODUCT_DELETE,
      PERMISSIONS.PRODUCT_IMPORT,
      PERMISSIONS.PRODUCT_EXPORT,
      PERMISSIONS.INVENTORY_UPDATE,
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.REVIEW_MODERATE,
      PERMISSIONS.COUPON_MANAGE,
      PERMISSIONS.SEO_MANAGE,
      PERMISSIONS.AUDIT_VIEW
    ]
  },
  PRODUCT_MANAGER: {
    name: 'PRODUCT_MANAGER',
    description: 'Manages catalog, agricultural machinery specs, inventory, and bulk imports',
    permissions: [
      PERMISSIONS.PRODUCT_CREATE,
      PERMISSIONS.PRODUCT_UPDATE,
      PERMISSIONS.PRODUCT_DELETE,
      PERMISSIONS.PRODUCT_IMPORT,
      PERMISSIONS.PRODUCT_EXPORT,
      PERMISSIONS.INVENTORY_UPDATE,
      PERMISSIONS.SEO_MANAGE
    ]
  },
  ORDER_MANAGER: {
    name: 'ORDER_MANAGER',
    description: 'Manages incoming farmer orders, shipping dispatch, and delivery statuses',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.INVENTORY_UPDATE
    ]
  },
  CONTENT_MANAGER: {
    name: 'CONTENT_MANAGER',
    description: 'Moderates reviews, updates FAQs, applications, and SEO copy',
    permissions: [
      PERMISSIONS.REVIEW_MODERATE,
      PERMISSIONS.SEO_MANAGE,
      PERMISSIONS.COUPON_MANAGE
    ]
  },
  SUPPORT_AGENT: {
    name: 'SUPPORT_AGENT',
    description: 'Views orders and customer contact requests for customer service',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.CUSTOMER_VIEW
    ]
  }
};

const PRODUCT_STATUS = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  PUBLISHED: 'Published',
  SCHEDULED: 'Scheduled',
  UNPUBLISHED: 'Unpublished',
  OUT_OF_STOCK: 'Out of Stock',
  DISCONTINUED: 'Discontinued'
};

const STOCK_STATUS = {
  IN_STOCK: 'IN STOCK',
  LOW_STOCK: 'LOW STOCK',
  OUT_OF_STOCK: 'OUT OF STOCK'
};

const ORDER_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded'
};

const REVIEW_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  HIDDEN: 'Hidden'
};

const IDEAL_FOR_PRESETS = [
  'Small Farms',
  'Medium Farms',
  'Large Farms',
  'Vegetable Farming',
  'Orchards',
  'Nurseries',
  'Gardening',
  'Paddy',
  'Wheat',
  'Sugarcane',
  'Fruit Farming',
  'Commercial Farming'
];

const DEFAULT_SPEC_GROUPS = [
  'ENGINE',
  'PERFORMANCE',
  'DIMENSIONS',
  'TRANSMISSION',
  'ELECTRICAL',
  'GENERAL'
];

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
  PRODUCT_STATUS,
  STOCK_STATUS,
  ORDER_STATUS,
  REVIEW_STATUS,
  IDEAL_FOR_PRESETS,
  DEFAULT_SPEC_GROUPS
};
