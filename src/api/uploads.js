import { apiFetch } from './http'

/**
 * Upload nhiều ảnh cùng lúc, field name "files" lặp lại cho từng file.
 * @param {File[]} files
 * @returns {Promise<string[]>} mảng URL, đúng thứ tự với files đã gửi
 */
export function uploadImages(files) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return apiFetch('/api/uploads/images', { method: 'POST', body: formData })
}
