import ImageKit from "@imagekit/nodejs";
import dotenv from "dotenv";

dotenv.config();

export const isImageKitConfigured = () => {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  return Boolean(
    publicKey &&
      publicKey.trim() !== "" &&
      publicKey.trim() !== "your_public_key" &&
      privateKey &&
      privateKey.trim() !== "" &&
      privateKey.trim() !== "your_private_key" &&
      urlEndpoint &&
      urlEndpoint.trim() !== "" &&
      urlEndpoint.trim() !== "your_url_endpoint"
  );
};

let imagekit = null;

if (isImageKitConfigured()) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY.trim(),
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY.trim(),
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT.trim(),
  });
}

export const uploadToImageKit = async (fileBuffer, originalFilename) => {
  if (!isImageKitConfigured() || !imagekit) {
    throw new Error(
      "ImageKit credentials missing or unconfigured in backend/.env"
    );
  }

  const sanitizedName = (originalFilename || "document.pdf").replace(
    /[^a-zA-Z0-9.-]/g,
    "_"
  );

  const response = await imagekit.files.upload({
    file: fileBuffer.toString("base64"),
    fileName: `${Date.now()}_${sanitizedName}`,
    folder: "/printsaas_orders",
    useUniqueFileName: true,
  });

  console.log(`✅ ImageKit upload successful: ${response.url}`);
  return response;
};

export const deleteFromImageKit = async (fileId) => {
  if (!fileId || !isImageKitConfigured() || !imagekit) return;
  try {
    const result = await imagekit.files.delete(fileId);
    console.log(`🗑️ ImageKit asset ${fileId} deleted`);
    return result;
  } catch (error) {
    console.error(
      `⚠️ Failed to delete ImageKit asset ${fileId}:`,
      error.message
    );
  }
};

export default imagekit;
