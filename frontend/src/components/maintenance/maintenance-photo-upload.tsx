"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 5;
const MAX_SIZE_MB = 10;

type MaintenancePhotoUploadProps = {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
};

export function MaintenancePhotoUpload({ files, onChange, disabled, className }: MaintenancePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(incoming: FileList | File[]) {
    setError(null);
    const list = Array.from(incoming);
    const next = [...files];

    for (const file of list) {
      if (next.length >= MAX_PHOTOS) {
        setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
        break;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Each photo must be ${MAX_SIZE_MB} MB or smaller.`);
        continue;
      }
      next.push(file);
    }

    onChange(next.slice(0, MAX_PHOTOS));
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-3 transition sm:p-5",
          dragOver ? "border-ustawi-navy bg-ustawi-cream/40" : "border-[#E8EAF2] bg-[#FAFBFE]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {files.length === 0 ? (
          <div className="flex flex-col items-center py-4 text-center">
            <ImagePlus className="h-10 w-10 text-ustawi-muted/50" strokeWidth={1.5} />
            <p className="mt-2 text-sm font-semibold text-ustawi-navy">Drag and drop photos here</p>
            <p className="mt-1 text-xs text-ustawi-muted">or tap to browse</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={URL.createObjectURL(file)}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(index);
                  }}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {files.length < MAX_PHOTOS && (
              <div className="flex aspect-square items-center justify-center rounded-lg border border-[#E8EAF2] bg-white">
                <ImagePlus className="h-6 w-6 text-ustawi-muted" />
              </div>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-ustawi-muted">
        Maximum {MAX_PHOTOS} photos, up to {MAX_SIZE_MB} MB each.
      </p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
