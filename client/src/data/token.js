// src/data/token.js — 관리자 토큰 보관 (sessionStorage, 탭을 닫으면 사라짐)

const TOKEN_KEY = 'dahExhibitionAdminToken'
const USER_KEY = 'dahExhibitionAdminUser'

function safe(fn, fallback = null) {
  try { return fn() } catch { return fallback }
}

export const tokenStore = {
  get: () => safe(() => sessionStorage.getItem(TOKEN_KEY)),
  getUser: () => safe(() => JSON.parse(sessionStorage.getItem(USER_KEY) || 'null')),
  set(token, user) {
    safe(() => {
      sessionStorage.setItem(TOKEN_KEY, token)
      sessionStorage.setItem(USER_KEY, JSON.stringify(user ?? null))
    })
  },
  setUser: user => safe(() => sessionStorage.setItem(USER_KEY, JSON.stringify(user ?? null))),
  clear() {
    safe(() => {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
    })
  },
}

// 관리자 요청이 401을 받으면 이 이벤트로 로그아웃 처리한다.
export const UNAUTHORIZED_EVENT = 'exhibition:unauthorized'
