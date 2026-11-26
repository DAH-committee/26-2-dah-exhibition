import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { World } from './World'
import { SCENES, sceneForPath, directionBetween } from './scenes'

// 전환 시간표(초). 기본 전환 T = 5초(보고서 1-3).
// 0 출발, 2.0 덮개 구름 등장, 2.5 가운데 단어, 3.25 장면 교체, 4.0 덮개 걷힘,
// 4.6 로고와 메뉴, 5.25 페이지 글자(원본 5.75초에서 0.5초 당김).
const T = 5
const AT = { cover: T * 0.4, word: T * 0.5, swap: (T / 2) * 1.3, uncover: T * 0.8, chrome: 4.6, ui: 5.25 }
const WORD_HOLD = T * 0.35 // 단어가 나타나는 데 1.75초, 사라지는 데 1.75초

const SkyContext = createContext(null)
const themeOf = key => (SCENES[key]?.palette === 'night' ? 'night' : 'dusk')

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
function isMobile() {
  return typeof window !== 'undefined' && (window.innerWidth <= 767 || window.matchMedia?.('(pointer: coarse)').matches)
}

export function SkyProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const hostRef = useRef(null)
  const worldRef = useRef(null)
  const locRef = useRef(location.pathname)
  const commanded = useRef(null)
  const sceneRef = useRef(null)
  const busy = useRef(false)
  const timers = useRef([])
  const [ui, setUi] = useState(false)
  const [chrome, setChrome] = useState(false)
  const [word, setWord] = useState({ text: '', on: false })
  const [flying, setFlying] = useState(false)
  const [ready, setReady] = useState(false)
  const reduced = useMemo(prefersReduced, [])

  locRef.current = location.pathname

  const later = (sec, fn) => { timers.current.push(setTimeout(fn, sec * 1000)) }
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const setTheme = key => { document.documentElement.dataset.theme = themeOf(key) }

  // 3D 세계 만들기
  useEffect(() => {
    let world
    let disposed = false
    try {
      world = new World(hostRef.current, { mobile: isMobile(), reduced })
    } catch {
      document.documentElement.classList.add('no-webgl')
      const key = sceneForPath(locRef.current)
      sceneRef.current = key
      setTheme(key)
      setReady(true)
      setUi(true)
      setChrome(true)
      return undefined
    }
    worldRef.current = world
    if (import.meta.env.DEV) window.__world = world
    world.load().then(async () => {
      if (disposed) return
      const key = sceneForPath(locRef.current)
      sceneRef.current = key
      setTheme(key)
      await world.setScene(key)
      world.start()
      setReady(true)
      requestAnimationFrame(() => { setUi(true); setChrome(true) })
    }).catch(() => {
      document.documentElement.classList.add('no-webgl')
      setReady(true)
      setUi(true)
      setChrome(true)
    })
    return () => {
      disposed = true
      clearTimers()
      world?.dispose()
      worldRef.current = null
    }
  }, [reduced])

  // 뒤로 가기, 앞으로 가기로 주소가 바뀐 경우: 페이지는 이미 바뀌었으므로 글자를 잠깐 감추고 같은 하늘을 짧게 날아간다
  useLayoutEffect(() => {
    const path = location.pathname
    if (commanded.current === path) { commanded.current = null; return }
    const key = sceneForPath(path)
    if (!ready) return
    const world = worldRef.current
    const fromKey = sceneRef.current
    clearTimers()
    busy.current = false
    setWord(w => ({ ...w, on: false }))
    sceneRef.current = key
    setTheme(key)
    if (!world || !world.ready || reduced) {
      world?.flyTo(key, { direction: 'None', duration: 0.6 })
      setUi(true)
      setChrome(true)
      return
    }
    const dir = key === fromKey ? 'None' : directionBetween(fromKey, key)
    const D = dir === 'None' ? 1 : 3.2
    setUi(false)
    setChrome(false)
    setFlying(dir !== 'None')
    world.flyTo(key, { direction: dir, duration: D })
    if (dir !== 'None') {
    }
    later(D * 0.8, () => setChrome(true))
    later(D * 0.92, () => { setUi(true); setFlying(false) })
  }, [location.pathname, ready, reduced])

  const flyTo = useCallback((to, { replace = false } = {}) => {
    const from = locRef.current
    if (busy.current || to === from) return
    const fromKey = sceneForPath(from)
    const toKey = sceneForPath(to)
    const world = worldRef.current
    const go = () => { commanded.current = to.split(/[?#]/)[0]; navigate(to, { replace }) }

    // 같은 하늘 안 이동(작품 목록과 작품 상세): 글자만 0.5초 감췄다 보이고, 구름은 짧게 앞으로 밀려 나간다
    if (fromKey === toKey || !world || !world.ready || reduced) {
      busy.current = true
      setUi(false)
      world?.flyTo(toKey, { direction: 'None', duration: 1.2 })
      later(0.5, () => {
        go()
        sceneRef.current = toKey
        setTheme(toKey)
        later(0.25, () => { setUi(true); setChrome(true); busy.current = false })
      })
      return
    }

    // 장면 사이 이동: 시작부터 끝까지 한 번의 비행(world.flyTo). 화면을 덮는 구름 없이 실제 구름 사이를 지난다.
    // 중간(3.25초)에는 주소와 글자만 바꾼다.
    const dir = directionBetween(fromKey, toKey)
    busy.current = true
    setFlying(true)
    setUi(false)
    setChrome(false)
    world.flyTo(toKey, { direction: dir, duration: T })
    later(AT.word, () => setWord({ text: SCENES[toKey]?.word ?? '', on: true }))
    later(AT.word + WORD_HOLD, () => setWord(w => ({ ...w, on: false })))
    later(AT.swap, () => {
      go()
      sceneRef.current = toKey
      setTheme(toKey)
    })
    later(AT.chrome, () => setChrome(true))
    later(AT.ui, () => { setUi(true); setFlying(false); busy.current = false })
  }, [navigate, reduced])

  const value = useMemo(() => ({ flyTo, ui, chrome, flying, ready, reduced }), [flyTo, ui, chrome, flying, ready, reduced])

  return (
    <SkyContext.Provider value={value}>
      <div ref={hostRef} className="fixed inset-0 z-canvas" aria-hidden="true" />
      <div
        className="pointer-events-none fixed inset-0 z-word flex items-center justify-center page-x"
        aria-hidden="true"
      >
        <span
          className="t-word text-center text-[#f8f6f2]"
          style={{
            opacity: word.on ? 1 : 0,
            transition: `opacity ${WORD_HOLD}s cubic-bezier(0.45, 0, 0.55, 1)`,
            textShadow: '0 2px 30px rgba(20, 30, 60, 0.18)',
          }}
        >
          {word.text}
        </span>
      </div>
      {children}
    </SkyContext.Provider>
  )
}

export function useSky() {
  const ctx = useContext(SkyContext)
  if (!ctx) throw new Error('useSky must be used inside <SkyProvider>')
  return ctx
}
