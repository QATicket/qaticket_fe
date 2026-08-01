import { apiFetch, tokenStorage } from './http'

export async function login(username, password) {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  })
  tokenStorage.setTokens(data)
  return data
}

export async function changePassword(oldPassword, newPassword) {
  return apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: { oldPassword, newPassword },
  })
}

export async function logout() {
  const refreshToken = tokenStorage.getRefreshToken()
  try {
    if (refreshToken) {
      await apiFetch('/api/auth/logout', { method: 'POST', body: { refreshToken } })
    }
  } finally {
    tokenStorage.clear()
  }
}
