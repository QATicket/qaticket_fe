const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Bắn 1 request "đánh thức" backend (Render free tier tự ngủ sau ~15 phút
 * không hoạt động, request đầu tiên có thể mất 30-60s để khởi động lại).
 * Gọi càng sớm càng tốt (lúc mở app) để giảm thời gian chờ thực tế khi user bấm Đăng nhập.
 */
export function warmUpBackend() {
  fetch(`${API_BASE_URL}/api/master/factories`).catch(() => {})
}

const ACCESS_TOKEN_KEY = 'qaticket.accessToken'
const REFRESH_TOKEN_KEY = 'qaticket.refreshToken'
const USER_INFO_KEY = 'qaticket.userInfo'

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUserInfo: () => {
    const raw = localStorage.getItem(USER_INFO_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setTokens: ({ accessToken, refreshToken, ...userInfo }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_INFO_KEY)
  },
}

export class ApiError extends Error {
  constructor(status, message, fieldErrors) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors || null
  }
}

const NO_AUTH_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout']

function isNoAuthPath(path) {
  return NO_AUTH_PATHS.some((p) => path.startsWith(p))
}

async function parseErrorResponse(res) {
  let body = null
  try {
    body = await res.json()
  } catch {
    // no JSON body
  }
  const message = body?.message || body?.error || `Yêu cầu thất bại (HTTP ${res.status})`
  const fieldErrors = body?.fieldErrors || null
  return new ApiError(res.status, message, fieldErrors)
}

let refreshPromise = null

async function doRefresh() {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) throw new ApiError(401, 'Không có refresh token')

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw await parseErrorResponse(res)
  const data = await res.json()
  tokenStorage.setTokens(data)
  return data
}

function notifySessionExpired() {
  tokenStorage.clear()
  window.dispatchEvent(new Event('qaticket:session-expired'))
}

/**
 * Wrapper quanh fetch: tự đính kèm Bearer token, tự refresh-and-retry 1 lần khi 401.
 * options.body: object thường (sẽ JSON.stringify) hoặc FormData (giữ nguyên, không set Content-Type).
 */
export async function apiFetch(path, options = {}) {
  const { params, body, headers, skipAuth, ...rest } = options

  let url = `${API_BASE_URL}${path}`
  if (params) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.append(key, value)
    })
    const qsString = qs.toString()
    if (qsString) url += `?${qsString}`
  }

  const finalHeaders = { ...headers }
  const isFormData = body instanceof FormData
  let finalBody = body
  if (body !== undefined && !isFormData) {
    finalHeaders['Content-Type'] = 'application/json'
    finalBody = JSON.stringify(body)
  }

  const needsAuth = !skipAuth && !isNoAuthPath(path)
  if (needsAuth) {
    const accessToken = tokenStorage.getAccessToken()
    if (accessToken) finalHeaders['Authorization'] = `Bearer ${accessToken}`
  }

  const doFetch = () =>
    fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
    })

  let res = await doFetch()

  if (res.status === 401 && needsAuth) {
    try {
      refreshPromise = refreshPromise || doRefresh()
      await refreshPromise
    } catch (err) {
      refreshPromise = null
      notifySessionExpired()
      throw err
    }
    refreshPromise = null

    const retryToken = tokenStorage.getAccessToken()
    if (retryToken) finalHeaders['Authorization'] = `Bearer ${retryToken}`
    res = await doFetch()

    if (res.status === 401) {
      notifySessionExpired()
      throw await parseErrorResponse(res)
    }
  }

  if (!res.ok) throw await parseErrorResponse(res)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
