/**
 * FileList Component
 * Displays downloadable files (datasheets, CAD files, etc.)
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, File, Box } from 'lucide-react'
import { useL } from '@/lib/i18n-inline'

export interface FileItem {
  title: string
  url: string
  type: 'pdf' | 'step' | 'iges' | 'dwg' | 'other'
  size?: string
}

interface FileListProps {
  files: FileItem[]
  className?: string
}

const fileIcons = {
  pdf: FileText,
  step: Box,
  iges: Box,
  dwg: Box,
  other: File,
}

const fileTypeLabels = {
  pdf: 'PDF',
  step: 'STEP',
  iges: 'IGES',
  dwg: 'DWG',
  other: 'Dosya',
}

export function FileList({ files, className }: FileListProps) {
  const L = useL()
  if (files.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{L('İndirilebilir Dosyalar', 'Downloadable Files')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {files.map((file, index) => {
            const Icon = fileIcons[file.type] || fileIcons.other
            const typeLabel = file.type === 'other' || !fileTypeLabels[file.type] ? L('Dosya', 'File') : fileTypeLabels[file.type]

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-palette rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-ink-muted" />
                  <div>
                    <div className="font-medium text-sm">{file.title}</div>
                    <div className="text-xs text-ink-muted">
                      {typeLabel}
                      {file.size && ` • ${file.size}`}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a href={file.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    {L('İndir', 'Download')}
                  </a>
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}


