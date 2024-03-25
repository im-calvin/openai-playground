import React, { createContext, useContext, useState } from 'react'
import { File } from './types'

interface UploadedFilesContextProps {
  uploadedFiles: File[]
  setUploadedFiles: (files: File[]) => void
  addUploadedFile: (file: File) => void
  refetchFiles: boolean
  setRefetchFiles: (refetch: boolean) => void
}

const UploadedFilesContext = createContext<UploadedFilesContextProps>({
  uploadedFiles: [],
  setUploadedFiles: () => {},
  addUploadedFile: () => {},
  refetchFiles: false,
  setRefetchFiles: () => {}
})

export const useUploadedFilesContext = () => useContext(UploadedFilesContext)

export const UploadedFilesProvider: React.FC<React.PropsWithChildren> = ({
  children
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [refetchFiles, setRefetchFiles] = useState(false)

  const addUploadedFile = (file: File) => {
    setUploadedFiles(prevFiles => [...prevFiles, file])
    setRefetchFiles(true)
  }

  return (
    <UploadedFilesContext.Provider
      value={{
        uploadedFiles,
        setUploadedFiles,
        addUploadedFile,
        refetchFiles,
        setRefetchFiles
      }}
    >
      {children}
    </UploadedFilesContext.Provider>
  )
}
