import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useSky } from '../sky/SkyProvider'
import { VISITED_KEY } from '../App'
import { pageTitle } from '../config'

const LINES = [
  '해가 지기 전, 집마다 한 사람이 옥상에 오릅니다.',
  '저마다 별 하나를 하늘에 답니다.',
  '밤이 되면 별들은 하나의 별자리가 됩니다.',
]

// 문장 시간표(보고서 1-1): 1줄 0.7초 등장, 2초 쉼, 2줄 0.7초, 3줄 0.7초, 2초 쉼, 1.5초 동안 지움
const SHOW_AT = [0.6, 3.3, 4.0]
const HIDE_AT = 6.7
const LEAVE_AT = 8.6

export default function IntroPage() {
  const { flyTo, ready } = useSky()
  const [shown, setShown] = useState([false, false, false])
  const [hidden, setHidden] = useState(false)
  const left = useRef(false)

  useEffect(() => {
    document.title = pageTitle()
    try { window.localStorage.setItem(VISITED_KEY, '1') } catch { /* 저장소를 못 쓰면 매번 인트로 */ }
  }, [])

  useEffect(() => {
    if (!ready) return undefined
    const ids = SHOW_AT.map((t, i) => setTimeout(() => setShown(s => s.map((v, j) => (j === i ? true : v))), t * 1000))
    ids.push(setTimeout(() => setHidden(true), HIDE_AT * 1000))
    ids.push(setTimeout(() => { if (!left.current) { left.current = true; flyTo('/', { replace: true }) } }, LEAVE_AT * 1000))
    return () => ids.forEach(clearTimeout)
  }, [ready, flyTo])

  const skip = () => {
    if (left.current) return
    left.current = true
    setHidden(true)
    flyTo('/', { replace: true })
  }

  return (
    <main className="relative z-page flex min-h-[100svh] flex-col items-center page-x" style={{ paddingTop: '30svh' }}>
      <h1 className="sr-only">2026-2 DAH EXHIBITION</h1>
      <div
        className="flex flex-col items-center gap-s2 text-center"
        style={{ opacity: hidden ? 0 : 1, transition: 'opacity 1.5s cubic-bezier(0.45, 0, 0.55, 1)' }}
      >
        {LINES.map((line, i) => (
          <p
            key={line}
            className="t-serif-line balance text-ink"
            style={{
              opacity: shown[i] ? 1 : 0,
              transform: shown[i] ? 'none' : 'translateY(6px)',
              transition: 'opacity 0.7s cubic-bezier(0.55, 0, 1, 0.45), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {line}
          </p>
        ))}
      </div>
      <button
        type="button"
        onClick={skip}
        className="t-label fixed bottom-s6 right-page flex items-center gap-s2 py-s2 text-ink"
      >
        SKIP <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </main>
  )
}
