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
import { useAIState } from 'ai/rsc'
import { AIState } from '@/lib/chat/actions'

interface FileUploadButtonProps {
  chatId?: string
}

export function FileUploadButton({ chatId }: FileUploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [aiState] = useAIState() as [AIState, unknown]

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const json = await fetcher('/api/chat/insertFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId,
          fileName: file.name,
          fileContents: await file.text()
        })
      })
      toast.success(`File ${file.name} uploaded successfully`)
    }
  }

  return (
    <>
      {chatId && (
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
      )}
    </>
  )
}
