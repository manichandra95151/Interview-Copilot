"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui";

export function ResumeUploader({
  token,
  onUploaded,
}: {
  token: string;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("resumes", f));
    setUploading(true);
    try {
      const res = await api.uploadCandidates(form, token);
      const okCount = res.created?.length || 0;
      const failCount = res.failed?.length || 0;
      if (okCount) toast(`Added ${okCount} candidate${okCount > 1 ? "s" : ""}`, "success");
      if (failCount) toast(`${failCount} file${failCount > 1 ? "s" : ""} failed to parse`, "error");
      onUploaded();
    } catch (e: any) {
      toast(e.message || "Upload failed", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files);
      }}
      className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging ? "border-[#4F46E5] bg-[#EEF0FF]/40" : "border-[#ECE8DF] bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
      <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-[#EEF0FF] text-[#4F46E5] flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <path d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-900">Drop resumes here, or</p>
      <p className="text-xs text-gray-400 mb-4">PDF, DOCX, or TXT — up to 25 at once</p>
      <Button size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
        Browse files
      </Button>
    </div>
  );
}
