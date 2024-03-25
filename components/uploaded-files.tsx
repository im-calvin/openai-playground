'use client'

import React, { useState, useEffect } from 'react'
import { getUploadedFiles } from '@/app/actions'
import { type File } from '@/lib/types'

interface UploadedFilesProps {
  userId?: string
}

export function UploadedFiles({ userId }: UploadedFilesProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  useEffect(() => {
    async function fetchFiles() {
      if (userId) {
        const files = await getUploadedFiles(userId)
        setUploadedFiles(files)
      }
    }

    fetchFiles()
  }, [userId])

  if (!userId) return null

  return (
    <div>
      <h4 className="text-md font-medium">Files Uploaded</h4>
      {uploadedFiles.length > 0 ? (
        <ul>
          {uploadedFiles.map(file => (
            <li key={file.id}>{file.name}</li>
          ))}
        </ul>
      ) : (
        <p>No files uploaded</p>
      )}
    </div>
  )
}
