'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props {
  onFileSelect: (file: File) => void
}

export default function FileUpload({ onFileSelect }: Props) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop
  })

  return (
    <div
      {...getRootProps()}
      className="w-full p-8 border-2 border-dashed border-gray-400 rounded-xl text-gray-700 font-medium text-center hover:bg-gray-50 hover:border-gray-600 transition-colors duration-200"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the contract here...</p>
      ) : (
        <p>Drag & drop a contract PDF here, or click to select</p>
      )}
    </div>
  )
}
