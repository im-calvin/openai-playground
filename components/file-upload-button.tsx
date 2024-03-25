'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { IconPlus } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { fetcher } from '@/lib/utils'
import { toast } from 'sonner'
import { useUploadedFilesContext } from '@/lib/file-upload-context'

interface FileUploadButtonProps {
  userId?: string
}

export function FileUploadButton({ userId }: FileUploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { addUploadedFile, setRefetchFiles } = useUploadedFilesContext()

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const fileContents = await file.text()
      const json = await fetcher('/api/user/uploadFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          fileContents,
          userId
        })
      })
      toast.success(`File ${file.name} uploaded successfully`)

      setRefetchFiles(true)
    }
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
            onClick={() => {
              fileInputRef.current?.click()
            }}
          >
            <IconPlus />
            <span className="sr-only">Upload File</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Upload File</TooltipContent>
      </Tooltip>
    </>
  )
}
