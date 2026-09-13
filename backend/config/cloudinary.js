import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

export const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return Boolean(
    cloudName &&
      cloudName.trim() !== "your_cloud_name" &&
      apiKey &&
      apiKey.trim() !== "your_api_key" &&
      apiSecret &&
      apiSecret.trim() !== "your_api_secret"
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
  });
}

export const uploadToCloudinary = (fileBuffer, originalFilename) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(
        new Error("Cloudinary credentials missing or unconfigured in backend/.env")
      );
    }

    const sanitizedName = (originalFilename || "document")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9]/g, "_");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "printsaas_orders",
        resource_type: "auto",
        public_id: `${Date.now()}_${sanitizedName}`,
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary Upload Error Details:", error);
          return reject(error);
        }
        console.log(`✅ Cloudinary upload successful: ${result.secure_url}`);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    let result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true
    });
    if (!result || result.result !== "ok") {
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
        invalidate: true
      });
    }
    console.log(`🗑️ Cloudinary asset ${publicId} deleted:`, result.result);
    return result;
  } catch (error) {
    console.error(`⚠️ Failed to delete Cloudinary asset ${publicId}:`, error.message);
  }
};

export default cloudinary;
