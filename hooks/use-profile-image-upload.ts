"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfileContext } from "@/contexts/profile-context";
import { resizeImage } from "@/lib/resize-image";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const AVATAR_MAX_SIZE = 512;

export function useProfileImageUpload() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateProfile } = useProfileContext();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  async function upload(file: File): Promise<void> {
    if (!file || !user?.id) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please choose a JPEG, PNG, WebP, GIF, or SVG image.");
      return;
    }

    setError(null);
    setUploading(true);

    const fileToUpload = await resizeImage(file, {
      maxWidth: AVATAR_MAX_SIZE,
      maxHeight: AVATAR_MAX_SIZE,
    });

    const supabase = createClient();
    const ext = fileToUpload.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile_pictures")
      .upload(path, fileToUpload, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("profile_pictures")
      .getPublicUrl(path);

    
    const cacheBuster = new Date().getTime();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_picture_url: `${urlData.publicUrl}?cacheBuster=${cacheBuster}` })
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    const newUrl = `${urlData.publicUrl}?cacheBuster=${cacheBuster}`;
    setUploadedUrl(newUrl);
    updateProfile({ profile_picture_url: newUrl });
    setUploading(false);
    router.refresh();
  }

  return { upload, uploading, uploadedUrl, error };
}
