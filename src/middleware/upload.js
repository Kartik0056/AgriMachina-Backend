const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk Storage for static media
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${cleanName}`);
  }
});

// Memory Storage for XLSX/CSV & ZIP archives
const memoryStorage = multer.memoryStorage();

// Image file filter
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image file type. Only JPG, PNG, and WEBP are supported.'), false);
  }
};

// Document & Spreadsheet filter
const documentFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported document format. Allowed: XLSX, CSV, PDF, ZIP.'), false);
  }
};

const uploadMedia = multer({
  storage: diskStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type.'), false);
    }
  }
});

const uploadSpreadsheet = multer({
  storage: memoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

const uploadZipArchive = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

module.exports = {
  uploadMedia,
  uploadSpreadsheet,
  uploadZipArchive
};
