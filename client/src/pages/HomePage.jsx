import SkyLink from '../components/SkyLink'
import Page from '../components/Page'

// 사방 메뉴(보고서 6절): 위 가운데, 아래 가운데, 왼쪽과 오른쪽은 세로 가운데
const EDGE = 'pointer-events-auto t-nav fg absolute px-s5 py-s4 transition-opacity duration-300 hover:opacity-70'

export default function HomePage() {
  return (
    <Page title="" className="pointer-events-none fixed inset-0 overflow-hidden">
      <SkyLink to="/about" className={`${EDGE} left-1/2 top-[76px] -translate-x-1/2 md:top-s3`} aria-label="ABOUT 전시 소개">ABOUT</SkyLink>
      <SkyLink to="/visit" className={`${EDGE} bottom-s3 left-1/2 -translate-x-1/2`} aria-label="VISIT 관람 안내">VISIT</SkyLink>
      <SkyLink to="/works" className={`${EDGE} left-[calc(var(--page-x)-24px)] top-1/2 -translate-y-1/2 max-md:[writing-mode:vertical-rl] max-md:rotate-180`} aria-label="WORKS 작품">WORKS</SkyLink>
      <SkyLink to="/awards" className={`${EDGE} right-[calc(var(--page-x)-24px)] top-1/2 -translate-y-1/2 max-md:[writing-mode:vertical-rl]`} aria-label="AWARDS 시상">AWARDS</SkyLink>

      <div className="absolute inset-x-0 flex flex-col items-center px-s9 text-center max-md:px-s8" style={{ top: 'max(22svh, calc(41.8svh - clamp(44px, 8.9vw, 128px)))' }}>
        <h1 className="t-display text-[#12303f]">
          DAH<br className="md:hidden" /> EXHIBITION
        </h1>
        <p className="t-subtitle mt-s6 text-ink">제19회 디지털인문예술전공 프로젝트 전시회</p>
        <div className="mt-s6 flex items-center gap-s4 text-[#12303f] md:gap-s5">
          <span className="t-date">12.01</span>
          <span aria-hidden="true" className="block h-px w-[clamp(48px,9vw,140px)] bg-current" />
          <span className="sr-only">부터</span>
          <span className="t-date">12.03</span>
        </div>
        <p className="t-subtitle mt-s4 text-ink">일송기념도서관 C.Square</p>
      </div>
    </Page>
  )
}
