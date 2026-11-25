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
    <svg viewBox="0 0 395.47 169.67" className="block h-[26px] w-auto" fill="currentColor" aria-hidden="true">
      <path d="M5.58,165.84c-.78,0-1.31,0-1.6,0l-3.97-.04L1.58,0l4.08.15c7.4.27,181.37,7.44,180.62,86.92-.73,76.48-161.58,78.77-180.7,78.77ZM9.45,8.3l-1.43,149.56c25.94-.36,169.68-5.32,170.31-70.87C178.96,21.43,35.66,9.86,9.45,8.3Z" /><path d="M277.02,169.67l-185.99-1.77L156.73,3.12l61.92.59,58.37,165.96ZM102.71,160.06l163.05,1.55L213,11.61l-50.9-.49-59.39,148.94Z" />
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
