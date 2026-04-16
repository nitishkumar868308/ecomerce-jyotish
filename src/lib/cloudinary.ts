import { API_CONFIG } from "./api";

interface UploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

export async function uploadToCloudinary(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", API_CONFIG.CLOUDINARY_PRESET);

  const response = await fetch(API_CONFIG.CLOUDINARY_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  return response.json();
}

export async function uploadMultipleToCloudinary(files: File[]): Promise<UploadResult[]> {
  return Promise.all(files.map(uploadToCloudinary));
}
