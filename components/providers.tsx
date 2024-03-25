'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UploadedFilesProvider } from '@/lib/file-upload-context'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <SidebarProvider>
        <TooltipProvider>
          <UploadedFilesProvider>{children}</UploadedFilesProvider>
        </TooltipProvider>
      </SidebarProvider>
    </NextThemesProvider>
  )
}
