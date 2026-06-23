'use client';

import { useRef, useState } from 'react';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

interface MediaUploadButtonProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function MediaUploadButton({
  files,
  onFilesChange,
  maxFiles = 20,
  maxSizeMB = 10,
}: MediaUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndAdd = (newFiles: File[]) => {
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        validationErrors.push(
          `"${file.name}": Only JPG, PNG, GIF, WebP, or PDF files accepted.`
        );
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        validationErrors.push(
          `"${file.name}": Photo too large. Please use a file under ${maxSizeMB}MB.`
        );
        continue;
      }
      validFiles.push(file);
    }

    if (files.length + validFiles.length > maxFiles) {
      validationErrors.push(`Maximum ${maxFiles} files.`);
      const allowed = maxFiles - files.length;
      onFilesChange([...files, ...validFiles.slice(0, allowed)]);
    } else {
      onFilesChange([...files, ...validFiles]);
    }

    setErrors(validationErrors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAdd(Array.from(e.target.files));
      // Reset input so same file can be re-added after removal
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      validateAndAdd(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
        multiple
        onChange={handleInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Upload button (full-width, tap-target compliant) */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Upload files — drag and drop or click to select"
        className={`w-full min-h-[56px] rounded-lg border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border hover:border-primary/50 hover:bg-muted/30 text-muted-foreground'
        }`}
      >
        <span className="text-xl">📷</span>
        <span>Take or choose a photo</span>
      </button>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="flex flex-col gap-1">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-600">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Thumbnail previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="relative w-16 h-16">
              {file.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-16 h-16 object-cover rounded-md border"
                />
              ) : (
                <div className="w-16 h-16 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground text-center p-1">
                  PDF
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center leading-none"
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
