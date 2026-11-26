import { useState } from 'react'
import Page from '../components/Page'
import Lightbox from '../components/Lightbox'

// 2026-2 공모전 두 곳. 1학기 Contest 화면처럼 공모전 이름, 최우수작 그림, 공모전 사이트 버튼만 둔다
const CONTESTS = [
  {
    id: 'exlibris',
    title: '장서표 디자인 공모전',
    image: { src: '/about/bookplate-donghae-best.png', width: 420, height: 596, alt: '장서표 디자인 공모전 최우수상 「동해를 읽다」, 여동규' },
    link: 'https://dah-bookplate-design-contest.vercel.app/bookplate_contest_26-2.html',
  },
  {
    id: 'poster',
    title: '전시회 포스터 공모전',
    image: { src: '/about/poster-one-star-per-house.jpg', width: 1414, height: 2000, alt: '전시회 포스터 공모전 최우수상 「One Star per House」, 주현호' },
    link: 'https://beyond-the-known-dah.vercel.app/',
  },
]

export default function ContestPage() {
  const [zoom, setZoom] = useState(null)
  return (
    <Page title="Contest" className="pb-s10">
      <div className="page-x pt-[calc(var(--top-bar)+8px)] md:pt-[calc(var(--top-bar)+16px)]">
        <h1 className="t-page-title fg">Contest</h1>
        <ul className="mt-s8 grid grid-cols-1 gap-s8 md:grid-cols-2 md:gap-x-s7">
          {CONTESTS.map(c => (
            <li key={c.id} className="flex flex-col items-center gap-s5 text-center">
              <h2 className="t-heading fg">{c.title}</h2>
              <button
                type="button"
                onClick={() => setZoom(c.image)}
                className="glass lift block w-full max-w-[360px] p-s2"
                aria-label={`${c.image.alt} 크게 보기`}
              >
                <img
                  src={c.image.src}
                  alt={c.image.alt}
                  width={c.image.width}
                  height={c.image.height}
                  className="w-full rounded"
                  style={{ aspectRatio: '1 / 1.414', objectFit: 'cover' }}
                />
              </button>
              <a href={c.link} target="_blank" rel="noreferrer" className="glass btn-soft t-small fg">
                공모전 보러가기
              </a>
            </li>
          ))}
        </ul>
      </div>
      <Lightbox src={zoom?.src ?? null} alt={zoom?.alt ?? ''} onClose={() => setZoom(null)} />
    </Page>
  )
}
