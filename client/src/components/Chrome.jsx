import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import SkyLink from './SkyLink'
import { useSky } from '../sky/SkyProvider'

export const MENU = [
  { to: '/', en: 'HOME', ko: '처음 화면' },
  { to: '/about', en: 'ABOUT', ko: '전시 소개' },
  { to: '/works', en: 'WORKS', ko: '작품' },
  { to: '/awards', en: 'AWARDS', ko: '시상' },
  { to: '/visit', en: 'VISIT', ko: '관람 안내' },
  { to: '/contest', en: 'CONTEST', ko: '포스터 공모전' },
  { to: '/lucid', en: 'LUCID', ko: '운영위원회' },
]

// DAH 로고 SVG(26-1 사이트와 같은 로고). 색은 글자 색을 따른다
function DahLogo() {
  return (
    <svg viewBox="0 0 396 170" className="block h-[26px] w-auto" fill="currentColor" aria-hidden="true">
      <path d="M5.57 165.84C4.79 165.84 4.26 165.84 3.97 165.84L0 165.8L1.57 0L5.65 0.15C13.05 0.42 187.02 7.59 186.27 87.07C185.54 163.55 24.69 165.84 5.57 165.84ZM9.44 8.3L8.01 157.86C33.95 157.5 177.69 152.54 178.32 86.99C178.95 21.43 35.65 9.86 9.44 8.3Z" /><path d="M277.01 169.67L91.02 167.9L156.72 3.12L218.64 3.71L277.01 169.67ZM102.7 160.06L265.75 161.61L212.99 11.61L162.09 11.12L102.7 160.06Z" /><path d="M393.96 165.68L386.01 165.6L386.81 81.55H241.35V164.07L233.4 164.18L229 6.44L236.95 6.21L238.82 73.6H383.36L387.53 7.54L395.46 7.83L393.96 165.68Z" />
    </svg>
  )
}

function MenuIcon({ open }) {
  // 두 줄 아이콘이 열리면 X로 바뀐다(transform만 사용)
  const line = 'absolute left-0 h-[1.5px] w-full bg-current transition-transform duration-500 ease-out'
  return (
    <span className="relative block h-[14px] w-[26px]" aria-hidden="true">
      <span className={line} style={{ top: open ? 6 : 1, transform: open ? 'rotate(45deg)' : 'none' }} />
      <span className={line} style={{ top: open ? 6 : 11, transform: open ? 'rotate(-45deg)' : 'scaleX(0.62)', transformOrigin: open ? 'center' : 'right' }} />
    </span>
  )
}

export default function Chrome() {
  const { chrome, flyTo } = useSky()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const inIntro = location.pathname === '/intro'
  const detail = /^\/works\/.+/.test(location.pathname)

  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!open) return undefined
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false) } }
    document.getElementById('scroller')?.classList.add('locked')
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.getElementById('scroller')?.classList.remove('locked')
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])
  // Esc: 열린 판이 없으면 한 단계 위로. 작품 상세는 작품 목록, 그 밖의 페이지는 처음 화면
  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const t = e.target
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const path = location.pathname
      if (path === '/' || path === '/intro') return
      flyTo(/^\/works\/.+/.test(path) ? '/works' : '/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [location.pathname, flyTo])

  if (inIntro) return null

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-chrome flex items-start justify-between pt-s6 ui-fade ${chrome ? '' : 'ui-hidden'}`}
        style={{ paddingLeft: 'var(--page-x)', paddingRight: 'calc(var(--page-x) + var(--gutter))' }}
      >
        <SkyLink to="/" className="pointer-events-auto fg t-nav flex items-baseline gap-s2 py-s1" aria-label="DAH 처음 화면">
          <DahLogo />
        </SkyLink>
        {detail ? (
          <button
            type="button"
            className="pointer-events-auto fg -mr-s2 flex h-s7 w-s7 items-center justify-center"
            aria-label="작품 목록으로 닫기"
            onClick={() => flyTo('/works')}
          >
            <X size={32} strokeWidth={1.25} />
          </button>
        ) : (
          <button
            type="button"
            className={`pointer-events-auto fg -mr-s2 flex h-s7 w-s7 items-center justify-center ${open ? 'invisible' : ''}`}
            aria-label="메뉴 열기"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <MenuIcon open={false} />
          </button>
        )}
      </div>

      {/* 메뉴 판: 오른쪽 40%, 유리 판, 항목 사이 64px */}
      <div
        className={`fixed inset-0 z-menu transition-opacity duration-500 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      >
        <nav
          aria-label="전체 메뉴"
          onClick={e => e.stopPropagation()}
          className="glass glass-strong elev-2 absolute inset-y-0 right-0 flex w-full flex-col justify-between overflow-y-auto rounded-none pb-s7 pt-s9 transition-transform duration-700 ease-out md:w-[40vw] md:min-w-[380px]"
          style={{ transform: open ? 'translateX(0)' : 'translateX(100%)', paddingLeft: 'clamp(24px, 5.6vw, 80px)', paddingRight: 'var(--page-x)' }}
        >
          <button
            type="button"
            className="fg absolute right-page top-s6 -mr-s2 flex h-s7 w-s7 items-center justify-center"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
          >
            <MenuIcon open />
          </button>
          <ul className="flex flex-col gap-s5 md:gap-s6">
            {MENU.map(m => {
              const active = m.to === '/' ? location.pathname === '/' : location.pathname.startsWith(m.to)
              return (
                <li key={m.to}>
                  <SkyLink
                    to={m.to}
                    tabIndex={open ? 0 : -1}
                    onClick={() => setOpen(false)}
                    className="fg group flex items-baseline gap-s4"
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={`t-nav transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>{m.en}</span>
                  </SkyLink>
                </li>
              )
            })}
          </ul>
          <div className="fg mt-s8 flex flex-col gap-s1">
            <p className="t-label">2026-2 DAH EXHIBITION</p>
            <p className="t-label fg-soft">12.01 ~ 12.03 C.SQUARE</p>
          </div>
        </nav>
      </div>
    </>
  )
}
