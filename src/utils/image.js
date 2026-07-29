export function blobToFile(blob, name) {
  return new File([blob], name, { type: blob.type || 'image/jpeg' })
}
