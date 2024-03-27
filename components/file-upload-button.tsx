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
  absolute?: boolean
}

export function FileUploadButton({
  userId,
  absolute = false
}: FileUploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { setRefetchFiles } = useUploadedFilesContext()

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId || '')
      const json = await fetcher('/api/user/uploadFile', {
        method: 'POST',
        body: formData
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
            className={`${absolute ? 'absolute left-0 top-[14px] sm:left-4' : ''} size-8 rounded-full bg-background p-0`}
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
