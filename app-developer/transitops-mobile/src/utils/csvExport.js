import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { createId } from './helpers'

function escapeCsvValue(value) {
  if (value == null) return ''
  const stringValue = String(value)
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

/**
 * Build a CSV string from headers + row objects/arrays.
 */
export function generateCsvString(rows = [], columns = []) {
  const headers =
    columns.length > 0
      ? columns.map((column) =>
          typeof column === 'string' ? column : column.key || column.header,
        )
      : rows[0] && !Array.isArray(rows[0])
        ? Object.keys(rows[0])
        : []

  const headerLabels =
    columns.length > 0
      ? columns.map((column) =>
          typeof column === 'string'
            ? column
            : column.header || column.label || column.key,
        )
      : headers

  const lines = []

  if (headerLabels.length > 0) {
    lines.push(headerLabels.map(escapeCsvValue).join(','))
  }

  rows.forEach((row) => {
    if (Array.isArray(row)) {
      lines.push(row.map(escapeCsvValue).join(','))
      return
    }

    const keys =
      columns.length > 0
        ? columns.map((column) =>
            typeof column === 'string' ? column : column.key,
          )
        : headers

    lines.push(
      keys
        .map((key) => {
          const column =
            typeof columns.find === 'function'
              ? columns.find(
                  (item) =>
                    item === key ||
                    (typeof item === 'object' && item.key === key),
                )
              : null
          const raw =
            column && typeof column === 'object' && typeof column.accessor === 'function'
              ? column.accessor(row)
              : row?.[key]
          return escapeCsvValue(raw)
        })
        .join(','),
    )
  })

  return lines.join('\n')
}

async function writeCsvFile(csvString, fileName) {
  const safeName = String(fileName || `export-${createId('csv')}.csv`).replace(
    /[^a-zA-Z0-9._-]/g,
    '_',
  )
  const file = new File(Paths.cache, safeName)

  if (file.exists) {
    file.delete()
  }

  file.create()
  file.write(csvString)

  return file
}

/**
 * Generate CSV, write to cache, share via the system sheet, then clean up.
 */
export async function exportCsv({
  rows = [],
  columns = [],
  fileName = `transitops-export-${Date.now()}.csv`,
  share = true,
} = {}) {
  const csvString = generateCsvString(rows, columns)
  return shareCsvString(csvString, fileName, { share })
}

/**
 * Share a pre-built CSV string (e.g. from reportService.exportCsv).
 */
export async function shareCsvString(
  csvString,
  fileName = `transitops-export-${Date.now()}.csv`,
  { share = true } = {},
) {
  const file = await writeCsvFile(String(csvString ?? ''), fileName)

  try {
    if (share) {
      const canShare = await Sharing.isAvailableAsync()
      if (!canShare) {
        throw new Error('Sharing is not available on this device')
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export CSV',
        UTI: 'public.comma-separated-values-text',
      })
    }

    return {
      uri: file.uri,
      csvString: String(csvString ?? ''),
      fileName: file.name,
    }
  } finally {
    try {
      if (file.exists) {
        file.delete()
      }
    } catch {
      // Best-effort cleanup; ignore filesystem errors after share.
    }
  }
}

export default {
  generateCsvString,
  exportCsv,
  shareCsvString,
}
