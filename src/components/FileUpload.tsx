"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  Music,
  Video,
  Archive,
  AlertCircle,
  Check,
  Loader2
} from "lucide-react"

export interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  url?: string
  uploadProgress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
  onFileRemoved: (fileId: string) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number // in MB
  maxFiles?: number
  mode?: 'compact' | 'full' // compact for message attachments, full for files tab
  existingFiles?: UploadedFile[]
  className?: string
}

export function FileUpload({
  onFilesUploaded,
  onFileRemoved,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.mp3', '.mp4', '.mov', '.zip'],
  maxFileSize = 10, // 10MB
  maxFiles = 5,
  mode = 'full',
  existingFiles = [],
  className = ""
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image
    if (fileType.startsWith('video/')) return Video
    if (fileType.startsWith('audio/')) return Music
    if (fileType.includes('pdf') || fileType.includes('document')) return FileText
    if (fileType.includes('zip') || fileType.includes('archive')) return Archive
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `File type ${fileExtension} is not supported`
    }

    return null
  }

  const simulateUpload = (fileId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 0
      let notified = false

      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)

          // Update file status to completed
          setFiles(prev => {
            const updatedFiles = prev.map(f =>
              f.id === fileId
                ? { ...f, uploadProgress: 100, status: 'completed' as const }
                : f
            )

            // Notify parent only once
            if (!notified) {
              notified = true
              const completedFile = updatedFiles.find(f => f.id === fileId)
              if (completedFile) {
                setTimeout(() => onFilesUploaded([completedFile]), 0)
              }
            }

            return updatedFiles
          })

          resolve()
        } else {
          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, uploadProgress: progress, status: 'uploading' as const }
              : f
          ))
        }
      }, 200)

      // Simulate occasional upload failure
      if (Math.random() < 0.1) {
        setTimeout(() => {
          clearInterval(interval)
          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'error' as const, error: 'Upload failed. Please try again.' }
              : f
          ))
          reject(new Error('Upload failed'))
        }, 1000)
      }
    })
  }

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = []
    const filesArray = Array.from(fileList)

    // Check max files limit
    if (files.length + filesArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    for (const file of filesArray) {
      const validationError = validateFile(file)

      const uploadedFile: UploadedFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0,
        status: validationError ? 'error' : 'pending',
        error: validationError || undefined,
        url: URL.createObjectURL(file) // For preview
      }

      newFiles.push(uploadedFile)
    }

    setFiles(prev => [...prev, ...newFiles])

    // Start uploads for valid files
    for (const file of newFiles) {
      if (file.status !== 'error') {
        try {
          await simulateUpload(file.id)
        } catch (error) {
          console.error('Upload failed for file:', file.name)
        }
      }
    }

    // Note: Parent component notification happens in simulateUpload when each file completes
  }, [files.length, maxFiles, onFilesUploaded])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId)
    if (fileToRemove?.url) {
      URL.revokeObjectURL(fileToRemove.url)
    }

    setFiles(prev => prev.filter(f => f.id !== fileId))
    onFileRemoved(fileId)
  }

  const retryUpload = async (fileId: string) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId
        ? { ...f, status: 'pending', error: undefined, uploadProgress: 0 }
        : f
    ))

    try {
      await simulateUpload(fileId)
      const updatedFile = files.find(f => f.id === fileId)
      if (updatedFile) {
        onFilesUploaded([{ ...updatedFile, status: 'completed' }])
      }
    } catch (error) {
      console.error('Retry upload failed for file:', fileId)
    }
  }

  if (mode === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={onFileInputChange}
          className="hidden"
        />

        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={onButtonClick}
          className="border-blue-200 hover:bg-blue-50"
          title="Attach files"
        >
          <Upload className="w-4 h-4" />
        </Button>

        {files.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 max-h-60 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Attached Files ({files.length})</h4>
            <div className="space-y-2">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.type)
                return (
                  <div key={file.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-xs">
                    <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-gray-900">{file.name}</p>
                      <p className="text-gray-500">{formatFileSize(file.size)}</p>
                      {file.status === 'uploading' && (
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${file.uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {file.status === 'completed' && <Check className="w-3 h-3 text-green-500" />}
                      {file.status === 'uploading' && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                      {file.status === 'error' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => retryUpload(file.id)}
                          className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                        >
                          <AlertCircle className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(file.id)}
                        className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes.join(',')}
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              dragActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Drop files here to upload
              </h3>
              <p className="text-gray-500 mb-4">
                or click to browse from your device
              </p>

              <Button onClick={onButtonClick} className="bg-blue-500 hover:bg-blue-600">
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>Supported formats: {acceptedFileTypes.join(', ')}</p>
              <p>Maximum file size: {maxFileSize}MB</p>
              <p>Maximum {maxFiles} files</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type)
              return (
                <Card key={file.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileIcon className="w-6 h-6 text-gray-500" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 truncate">{file.name}</h5>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>

                      {/* Status */}
                      <div className="mt-2">
                        {file.status === 'pending' && (
                          <Badge variant="outline" className="border-gray-300 text-gray-600">
                            Pending
                          </Badge>
                        )}
                        {file.status === 'uploading' && (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                              <span className="text-xs text-blue-600">
                                Uploading... {Math.round(file.uploadProgress)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${file.uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {file.status === 'completed' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <Check className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                        )}
                        {file.status === 'error' && (
                          <div className="space-y-1">
                            <Badge variant="outline" className="border-red-300 text-red-600">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                            {file.error && (
                              <p className="text-xs text-red-500">{file.error}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {file.status === 'error' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryUpload(file.id)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          Retry
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
