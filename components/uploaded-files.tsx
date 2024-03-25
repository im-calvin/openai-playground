'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { getUploadedFiles } from '@/app/actions'
import { File } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { useUploadedFilesContext } from '@/lib/file-upload-context'
import { FileUploadButton } from '@/components/file-upload-button'

interface UploadedFilesProps {
  userId?: string
}

export function UploadedFiles({ userId }: UploadedFilesProps) {
  const { uploadedFiles, setUploadedFiles, refetchFiles, setRefetchFiles } =
    useUploadedFilesContext()

  useEffect(() => {
    async function fetchFiles() {
      if (userId) {
        console.log('fetching files')
        const files = await getUploadedFiles(userId)
        setUploadedFiles(files)
        setRefetchFiles(false)
      }
    }

    fetchFiles()
  }, [userId, refetchFiles])

  if (!userId) return null

  const handleFileSelect = (fileId: string) => {
    const updatedFiles = uploadedFiles.map(file => {
      if (file.id === fileId) {
        return {
          ...file,
          selected: !file.selected
        }
      }
      return file
    })

    setUploadedFiles(updatedFiles)
  }

  return (
    <div>
      <h4 className="text-md font-medium">Files Uploaded</h4>
      {userId && <FileUploadButton userId={userId} />}
      <Suspense fallback={<div>Loading files...</div>}>
        {uploadedFiles.length > 0 ? (
          <ul>
            {uploadedFiles.map(file => (
              <li
                key={file.id}
                className="flex items-center justify-between py-2"
              >
                <span>{file.name}</span>
                <Checkbox
                  checked={file.selected}
                  onCheckedChange={() => handleFileSelect(file.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>No files uploaded</p>
        )}
      </Suspense>
    </div>
  )
}
