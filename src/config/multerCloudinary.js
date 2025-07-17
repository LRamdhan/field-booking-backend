import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'cloudinary';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from './env.js';
import ValidationError from '../exception/ValidationError.js';

const cloudinaryV2 = cloudinary.v2

cloudinaryV2.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinaryV2,
    params: (req, file) => {
      const allowedTypes = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "tiff",
        "tif",
        "svg",
        "ico",
        "webp"
      ]
      const type = file.mimetype.split('/')[1]

      if(!allowedTypes.includes(type)) {
        throw new ValidationError("File type is not allowed");
      }

      let fileName = file.originalname.split('.')
      fileName.pop()
      fileName = fileName.join('.')

      return ({
        folder: 'fieldbooking',
        // format: 'jpg', // Force file format
        public_id: Date.now() + '-' + fileName,
      })
    },
});

const upload = multer({ storage: storage });

export default upload;
