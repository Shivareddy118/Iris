"use client"

import { useState, useRef, useCallback } from "react"
import {
  Folder,
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  FilePlus,
  FolderPlus,
  Trash2,
  Download,
  Eye,
  ChevronRight,
  ChevronDown,
  Upload,
  X,
  ArrowLeft,
} from "lucide-react"

export interface VirtualFile {
  id: string
  name: string
  type: "file" | "folder"
  mimeType?: string
  size?: number
  content?: string
  blobUrl?: string
  children?: VirtualFile[]
  parentId?: string | null
  createdAt: Date
}

function getFileIcon(file: VirtualFile) {
  if (file.type === "folder") return <Folder className="h-4 w-4 text-primary" />
  if (file.mimeType?.startsWith("image/")) return <FileImage className="h-4 w-4 text-chart-2" />
  if (file.mimeType?.startsWith("audio/")) return <FileAudio className="h-4 w-4 text-chart-3" />
  if (file.mimeType?.startsWith("video/")) return <FileVideo className="h-4 w-4 text-chart-4" />
  return <FileText className="h-4 w-4 text-muted-foreground" />
}

function formatSize(bytes?: number) {
  if (!bytes) return "--"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface FileManagerProps {
  files: VirtualFile[]
  setFiles: React.Dispatch<React.SetStateAction<VirtualFile[]>>
  onPlayAudio?: (file: VirtualFile) => void
}

export function FileManager({ files, setFiles, onPlayAudio }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null)
  const [previewFile, setPreviewFile] = useState<VirtualFile | null>(null)
  const [newItemName, setNewItemName] = useState("")
  const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const uploadRef = useRef<HTMLInputElement>(null)
  const folderUploadRef = useRef<HTMLInputElement>(null)

  const getCurrentFiles = useCallback(() => {
    let current = files
    for (const pathId of currentPath) {
      const folder = current.find((f) => f.id === pathId)
      if (folder?.children) {
        current = folder.children
      }
    }
    return current
  }, [files, currentPath])

  const getCurrentPathNames = useCallback(() => {
    const names: { id: string; name: string }[] = []
    let current = files
    for (const pathId of currentPath) {
      const folder = current.find((f) => f.id === pathId)
      if (folder) {
        names.push({ id: folder.id, name: folder.name })
        current = folder.children || []
      }
    }
    return names
  }, [files, currentPath])

  const addFileToPath = useCallback(
    (newFile: VirtualFile, path: string[]) => {
      setFiles((prev) => {
        if (path.length === 0) return [...prev, newFile]
        const clone = JSON.parse(JSON.stringify(prev)) as VirtualFile[]
        let current = clone
        for (const pathId of path) {
          const folder = current.find((f) => f.id === pathId)
          if (folder) {
            if (!folder.children) folder.children = []
            current = folder.children
          }
        }
        current.push(newFile)
        return clone
      })
    },
    [setFiles]
  )

  const deleteFile = useCallback(
    (fileId: string) => {
      const removeFromList = (list: VirtualFile[]): VirtualFile[] => {
        return list
          .filter((f) => f.id !== fileId)
          .map((f) => ({
            ...f,
            children: f.children ? removeFromList(f.children) : undefined,
          }))
      }
      setFiles((prev) => removeFromList(prev))
      if (selectedFile?.id === fileId) setSelectedFile(null)
      if (previewFile?.id === fileId) setPreviewFile(null)
    },
    [setFiles, selectedFile, previewFile]
  )

  const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const blobUrl = URL.createObjectURL(file)
        const newFile: VirtualFile = {
          id: crypto.randomUUID(),
          name: file.name,
          type: "file",
          mimeType: file.type,
          size: file.size,
          blobUrl,
          createdAt: new Date(),
        }
        addFileToPath(newFile, currentPath)
      }
      reader.readAsArrayBuffer(file)
    })
    e.target.value = ""
  }

  const handleUploadFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return

    const folderStructure: Record<string, VirtualFile> = {}

    Array.from(fileList).forEach((file) => {
      const pathParts = file.webkitRelativePath.split("/")
      const blobUrl = URL.createObjectURL(file)

      let parentPath = ""
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i]
        const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName
        if (!folderStructure[folderPath]) {
          folderStructure[folderPath] = {
            id: crypto.randomUUID(),
            name: folderName,
            type: "folder",
            children: [],
            createdAt: new Date(),
          }
        }
        parentPath = folderPath
      }

      const newFile: VirtualFile = {
        id: crypto.randomUUID(),
        name: pathParts[pathParts.length - 1],
        type: "file",
        mimeType: file.type,
        size: file.size,
        blobUrl,
        createdAt: new Date(),
      }

      if (parentPath && folderStructure[parentPath]) {
        folderStructure[parentPath].children!.push(newFile)
      }
    })

    // Nest folders properly
    const rootFolders: VirtualFile[] = []
    const paths = Object.keys(folderStructure).sort()

    paths.forEach((path) => {
      const parts = path.split("/")
      if (parts.length === 1) {
        rootFolders.push(folderStructure[path])
      } else {
        const parentPath = parts.slice(0, -1).join("/")
        if (folderStructure[parentPath]) {
          folderStructure[parentPath].children!.push(folderStructure[path])
        }
      }
    })

    rootFolders.forEach((folder) => {
      addFileToPath(folder, currentPath)
    })

    e.target.value = ""
  }

  const handleCreate = () => {
    if (!newItemName.trim() || !creatingType) return
    const newItem: VirtualFile = {
      id: crypto.randomUUID(),
      name: newItemName.trim() + (creatingType === "file" && !newItemName.includes(".") ? ".txt" : ""),
      type: creatingType,
      mimeType: creatingType === "file" ? "text/plain" : undefined,
      content: creatingType === "file" ? "" : undefined,
      children: creatingType === "folder" ? [] : undefined,
      createdAt: new Date(),
    }
    addFileToPath(newItem, currentPath)
    setNewItemName("")
    setCreatingType(null)
  }

  const openFolder = (folderId: string) => {
    setCurrentPath((prev) => [...prev, folderId])
    setSelectedFile(null)
  }

  const navigateBack = () => {
    setCurrentPath((prev) => prev.slice(0, -1))
    setSelectedFile(null)
  }

  const navigateTo = (index: number) => {
    setCurrentPath((prev) => prev.slice(0, index + 1))
    setSelectedFile(null)
  }

  const handleFileClick = (file: VirtualFile) => {
    if (file.type === "folder") {
      openFolder(file.id)
    } else {
      setSelectedFile(file)
      if (file.mimeType?.startsWith("audio/") && onPlayAudio) {
        onPlayAudio(file)
      }
    }
  }

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const currentFiles = getCurrentFiles()
  const pathNames = getCurrentPathNames()

  return (
    <div className="flex h-full flex-col">
      {/* Header toolbar */}
      <div className="flex items-center gap-2 border-b border-border p-3">
        <button
          onClick={navigateBack}
          disabled={currentPath.length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-30"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <button
            onClick={() => setCurrentPath([])}
            className="transition-colors hover:text-primary"
          >
            Root
          </button>
          {pathNames.map((p, i) => (
            <span key={p.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <button
                onClick={() => navigateTo(i)}
                className="transition-colors hover:text-primary"
              >
                {p.name}
              </button>
            </span>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setCreatingType("file")}
            className="flex h-8 items-center gap-1 rounded-md bg-secondary px-2 text-xs text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            title="New File"
          >
            <FilePlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New File</span>
          </button>
          <button
            onClick={() => setCreatingType("folder")}
            className="flex h-8 items-center gap-1 rounded-md bg-secondary px-2 text-xs text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            title="New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          <button
            onClick={() => uploadRef.current?.click()}
            className="flex h-8 items-center gap-1 rounded-md bg-secondary px-2 text-xs text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            title="Upload Files"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Files</span>
          </button>
          <button
            onClick={() => folderUploadRef.current?.click()}
            className="flex h-8 items-center gap-1 rounded-md bg-primary px-2 text-xs text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Upload Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Folder</span>
          </button>
        </div>

        <input
          ref={uploadRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUploadFiles}
        />
        <input
          ref={folderUploadRef}
          type="file"
          // @ts-expect-error - webkitdirectory is a non-standard attribute
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={handleUploadFolder}
        />
      </div>

      {/* Create new item bar */}
      {creatingType && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 p-2">
          <span className="text-xs text-muted-foreground">
            New {creatingType}:
          </span>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder={creatingType === "file" ? "filename.txt" : "folder name"}
            className="h-7 flex-1 rounded-md border border-border bg-input px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <button
            onClick={handleCreate}
            className="h-7 rounded-md bg-primary px-3 text-xs text-primary-foreground"
          >
            Create
          </button>
          <button
            onClick={() => {
              setCreatingType(null)
              setNewItemName("")
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {currentFiles.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
            <Folder className="h-12 w-12 opacity-30" />
            <p className="text-sm">This folder is empty</p>
            <p className="text-xs">Upload files or create new ones to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {currentFiles.map((file) => (
              <div
                key={file.id}
                className={`group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/70 ${
                  selectedFile?.id === file.id ? "bg-secondary" : ""
                }`}
                onClick={() => handleFileClick(file)}
              >
                {file.type === "folder" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(file.id)
                    }}
                    className="flex h-4 w-4 items-center justify-center"
                  >
                    {expandedFolders.has(file.id) ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                ) : (
                  <span className="h-4 w-4" />
                )}

                {getFileIcon(file)}

                <span className="flex-1 truncate text-sm text-foreground">
                  {file.name}
                </span>

                <span className="text-xs text-muted-foreground">
                  {formatSize(file.size)}
                </span>

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {file.type === "file" && file.blobUrl && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewFile(file)
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-muted-foreground hover:text-primary"
                        title="Preview"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <a
                        href={file.blobUrl}
                        download={file.name}
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-muted-foreground hover:text-primary"
                        title="Download"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteFile(file.id)
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-medium text-foreground">{previewFile.name}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {previewFile.mimeType?.startsWith("image/") && previewFile.blobUrl && (
                <img
                  src={previewFile.blobUrl}
                  alt={previewFile.name}
                  className="mx-auto max-h-[60vh] rounded-lg object-contain"
                />
              )}
              {previewFile.mimeType?.startsWith("audio/") && previewFile.blobUrl && (
                <div className="flex items-center justify-center py-8">
                  <audio controls src={previewFile.blobUrl} className="w-full max-w-md" />
                </div>
              )}
              {previewFile.mimeType?.startsWith("video/") && previewFile.blobUrl && (
                <video controls src={previewFile.blobUrl} className="mx-auto max-h-[60vh] rounded-lg" />
              )}
              {previewFile.mimeType?.startsWith("text/") && (
                <pre className="whitespace-pre-wrap rounded-lg bg-secondary p-4 text-sm text-foreground">
                  {previewFile.content || "Empty file"}
                </pre>
              )}
              {!previewFile.mimeType?.startsWith("image/") &&
                !previewFile.mimeType?.startsWith("audio/") &&
                !previewFile.mimeType?.startsWith("video/") &&
                !previewFile.mimeType?.startsWith("text/") && (
                  <p className="text-center text-sm text-muted-foreground">
                    Preview not available for this file type.
                  </p>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
