// Gate.jsx: 공개 전 잠금. 어느 주소로 들어와도 "사이트 제작 중"만 보인다.
// 오른쪽 아래 보이지 않는 버튼을 빠르게 3번 누르면 비밀번호 칸이 나오고, 맞으면 이 브라우저에서는 계속 열린다.
// 공개할 때는 main.jsx의 LOCKED를 false로 바꾼다. 비밀번호는 글자 그대로 두지 않고 SHA-256 값만 둔다.
import { useRef, useState } from 'react'

const HASH = 'e79491b08d647ed2a9b80c4df8c149c38b430fc7b779599fe11002a3392d2586'
const KEY = 'dah262.unlock'

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function isUnlocked() {
  try {
    return localStorage.getItem(KEY) === HASH
  } catch {
    return false
  }
}

export default function Gate({ onUnlock }) {
  const [asking, setAsking] = useState(false)
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)
  const taps = useRef([])

  const tap = () => {
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < 1200), now]
    if (taps.current.length >= 3) {
      taps.current = []
      setAsking(true)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if ((await sha256(value)) === HASH) {
      try {
        localStorage.setItem(KEY, HASH)
      } catch {
        /* 저장을 못 해도 이번에는 연다 */
      }
      onUnlock()
      return
    }
    setWrong(true)
    setValue('')
  }

  const wrap = { position: 'fixed', inset: 0, background: '#ffffff', color: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, padding: 24, textAlign: 'center', wordBreak: 'keep-all', fontFamily: "'Pretendard Variable', Pretendard, system-ui, sans-serif" }
  return (
    <main style={wrap}>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.01em' }}>사이트 제작 중...</p>
      {asking && (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); setWrong(false) }}
            aria-label="비밀번호"
            placeholder="비밀번호"
            style={{ width: 220, height: 44, padding: '0 14px', border: 0, borderRadius: 8, background: '#f1f1f3', fontSize: 16, outline: 'none', textAlign: 'center' }}
          />
          {wrong && <span style={{ fontSize: 13, color: '#c0392b' }}>비밀번호가 맞지 않습니다</span>}
        </form>
      )}
      <button
        type="button"
        onClick={tap}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'fixed', right: 0, bottom: 0, width: 64, height: 64, opacity: 0, border: 0, background: 'transparent', cursor: 'default', WebkitTapHighlightColor: 'transparent' }}
      />
    </main>
  )
}
