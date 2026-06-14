import { supabase } from "@/integrations/supabase/client";

export interface Resume {
  id: string;
  name: string;
  content: string;
  image_path: string | null;
  created_at: string;
}

async function currentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// List the current user's resumes, newest first.
export async function listResumes(): Promise<Resume[]> {
  const { data, error } = await supabase
    .from("resumes")
    .select("id, name, content, image_path, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Resume[];
}

interface CreateResumeInput {
  name: string;
  content: string;
  file?: File | null;
}

// Create a resume. If an image file is provided it is uploaded to the private
// `resumes` bucket under the user's own folder, and the path is stored.
export async function createResume({
  name,
  content,
  file,
}: CreateResumeInput): Promise<Resume> {
  const uid = await currentUserId();
  if (!uid) throw new Error("Not authenticated");

  let imagePath: string | null = null;
  if (file) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${uid}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("resumes")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;
    imagePath = path;
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert({ user_id: uid, name, content, image_path: imagePath })
    .select("id, name, content, image_path, created_at")
    .single();
  if (error) throw error;
  return data as Resume;
}

// Delete a resume row and its image (if any).
export async function deleteResume(
  id: string,
  imagePath?: string | null,
): Promise<void> {
  if (imagePath) {
    await supabase.storage.from("resumes").remove([imagePath]);
  }
  const { error } = await supabase.from("resumes").delete().eq("id", id);
  if (error) throw error;
}

// Signed URL for a private resume image (valid for 1 hour).
export async function getResumeSignedUrl(
  imagePath: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(imagePath, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}

// ---- Onboarding flag (stored on profiles) ----

export async function getOnboarded(): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return true; // not logged in: don't trigger onboarding
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", uid)
    .maybeSingle();
  if (error) return true;
  return data?.onboarded ?? false;
}

export async function setOnboarded(value = true): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  await supabase.from("profiles").update({ onboarded: value }).eq("id", uid);
}
