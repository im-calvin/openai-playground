'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { getUploadedFiles } from '@/app/actions'
import { File } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { useUploadedFilesContext } from '@/lib/file-upload-context'
import { FileUploadButton } from '@/components/file-upload-button'
import { IconTrash } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface UploadedFilesProps {
  userId?: string
}

export function UploadedFiles({ userId }: UploadedFilesProps) {
  const { uploadedFiles, setUploadedFiles, refetchFiles, setRefetchFiles } =
    useUploadedFilesContext()

  useEffect(() => {
    async function fetchFiles() {
      if (userId) {
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

  const handleFileTrash = async (fileId: string) => {
    const file = uploadedFiles.find(file => file.id === fileId)
    if (file) {
      await fetch(`/api/user/deleteFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId
        })
      })
      setRefetchFiles(true)
      toast.success('File deleted successfully')
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between p-2">
        <h4 className="text-sm font-medium">Files Uploaded</h4>
        {userId && <FileUploadButton userId={userId} />}
      </div>
      <Suspense fallback={<div>Loading files...</div>}>
        {uploadedFiles.length > 0 ? (
          <ul>
            {uploadedFiles.map(file => (
              <li
                key={file.id}
                className="flex items-center justify-between py-2"
              >
                <span>{file.name}</span>
                <div className="grow" />
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleFileTrash(file.id)}
                    className="size-7 p-0 hover:bg-background"
                  >
                    <IconTrash />
                    <span className="sr-only">Delete</span>
                  </Button>
                  <Checkbox
                    checked={file.selected}
                    onCheckedChange={() => handleFileSelect(file.id)}
                  />
                </div>
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
