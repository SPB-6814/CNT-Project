'use client';

import React, { useCallback } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';

interface FileDropzoneProps extends DropzoneOptions {
  className?: string;
  label?: string;
  acceptLabel?: string;
}

export function FileDropzone({ className, label = "Drag & drop files here", acceptLabel = "or click to browse", ...props }: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (props.onDrop) {
      props.onDrop(acceptedFiles, [], null as any);
    }
  }, [props]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ ...props, onDrop });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors duration-300",
        isDragActive 
          ? "border-primary bg-primary/10 terminal-glow-active" 
          : "border-border bg-card/50 hover:bg-card/80",
        className
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className={cn("w-10 h-10 mb-3 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")} />
      <p className="text-sm font-mono text-center text-foreground">
        {isDragActive ? "Initiating data transfer..." : label}
      </p>
      <p className="text-xs text-muted-foreground mt-2">{acceptLabel}</p>
    </div>
  );
}
