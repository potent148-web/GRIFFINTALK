const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.72

export function isImageFile(file) {
  return file.type.startsWith('image/')
}

export async function compressImage(file) {
  if (file.type === 'image/gif') return file

  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  )

  if (!blob || blob.size >= file.size) return file

  return new File([blob], renameToJpg(file.name), { type: 'image/jpeg' })
}

function renameToJpg(filename) {
  const base = filename.replace(/\.[^.]+$/, '')
  return `${base}.jpg`
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
