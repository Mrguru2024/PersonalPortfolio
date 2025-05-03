import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Simple logger function (previously imported from vite.ts)
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Create a unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// Filter function to check file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define accepted mime types
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  const acceptedTypes = [...imageTypes, ...videoTypes];
  
  if (acceptedTypes.includes(file.mimetype)) {
    // Accept file
    cb(null, true);
  } else {
    // Reject file
    cb(new Error(`File type not supported. Supported types: ${acceptedTypes.join(', ')}`));
  }
};

// Set up multer with the defined storage and file filter
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter
}).single('media'); // 'media' is the field name in the form

export const uploadController = {
  uploadMedia: (req: Request, res: Response) => {
    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'File too large. Maximum file size is 10MB.'
            });
          }
          return res.status(400).json({ error: err.message });
        }
        
        // Some other error occurred
        return res.status(500).json({ error: err.message });
      }
      
      // If no file was provided
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }
      
      const isImage = req.file.mimetype.startsWith('image/');
      const isVideo = req.file.mimetype.startsWith('video/');
      const fileType = isImage ? 'image' : isVideo ? 'video' : 'file';
      
      // Create the URL for the uploaded file
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      
      log(`Uploaded ${fileType}: ${fileUrl}`, 'upload');
      
      // Return the file URL to the client
      return res.status(200).json({
        message: `${fileType} uploaded successfully`,
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    });
  },
  
  // Method to serve the uploaded files
  serveMedia: (req: Request, res: Response) => {
    const fileName = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Serve the file
    res.sendFile(filePath);
  }
};