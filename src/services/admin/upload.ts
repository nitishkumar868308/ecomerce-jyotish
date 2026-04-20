import { useMutation } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export interface UploadResult {
  url: string;
  publicId: string;
}

export function useUpload() {
  return useMutation({
    mutationFn: async ({
      file,
      folder,
    }: {
      file: File;
      folder?: string;
    }): Promise<UploadResult> => {
      const fd = new FormData();
      fd.append("file", file);
      if (folder) fd.append("folder", folder);

      const { data } = await api.post<ApiResponse<UploadResult>>(
        ENDPOINTS.UPLOAD,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Upload failed");
    },
  });
}
