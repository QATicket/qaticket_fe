export function blobToFile(blob, name) {
  return new File([blob], name, { type: blob.type || 'image/jpeg' })
}

const MAX_DIMENSION = 1600

// Convert bất kỳ ảnh nào (kể cả HEIC từ thư viện iPhone) sang JPEG bằng canvas
// trước khi upload, vì backend và nhiều trình duyệt không xử lý được HEIC.
export function convertImageToJpeg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blobToFile(blob, file.name.replace(/\.\w+$/, '.jpg')))
          else reject(new Error(`Không đọc được ảnh "${file.name}"`))
        },
        'image/jpeg',
        0.9,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Không đọc được ảnh "${file.name}"`))
    }
    img.src = url
  })
}
