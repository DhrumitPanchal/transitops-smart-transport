/**
 * Download a CSV export and revoke the temporary object URL.
 */
export function downloadCsvExport(exportPayload) {
  if (!exportPayload) {
    throw new Error('Export payload is missing')
  }

  let blob = exportPayload.blob || null
  const fileName =
    exportPayload.fileName ||
    exportPayload.filename ||
    `transitops-report-${Date.now()}.csv`

  if (!blob && exportPayload.content != null) {
    blob = new Blob([exportPayload.content], {
      type: exportPayload.contentType || 'text/csv;charset=utf-8',
    })
  }

  if (!blob) {
    throw new Error('Export file is empty')
  }

  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)

  return fileName
}
