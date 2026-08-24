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

// Allowed file extensions for attachments (Images, Documents, PDFs, Audio, Video)
const allowedMediaExtensions = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt',
  '.mp4', '.mov', '.avi', '.webm', '.mkv', '.zip'
];

const uploadMedia = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMediaExtensions.includes(ext) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.includes('pdf')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type (${ext || file.mimetype}). Allowed: Photos, PDFs, Docs, MP4 Videos up to 5MB.`), false);
    }
  }
});

const uploadSpreadsheet = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
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
