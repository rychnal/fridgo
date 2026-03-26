import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  folder: string = "fridgo/scans"
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          { width: 1920, height: 1080, crop: "limit" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Nahrávání obrázku selhalo: ${error.message}`));
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary nevrátil žádný výsledek"));
          return;
        }
        resolve(result as CloudinaryUploadResult);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function deleteImageFromCloudinary(
  publicId: string
): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
