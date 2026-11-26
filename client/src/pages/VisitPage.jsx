import Page from '../components/Page'
import { EXHIBITION } from '../data/exhibition'

const MAPS = [
  { label: '네이버 지도', url: 'https://map.naver.com/p/search/%ED%95%9C%EB%A6%BC%EB%8C%80%ED%95%99%EA%B5%90%20%EC%9D%BC%EC%86%A1%EA%B8%B0%EB%85%90%EB%8F%84%EC%84%9C%EA%B4%80' },
  { label: '카카오맵', url: 'https://map.kakao.com/?q=%ED%95%9C%EB%A6%BC%EB%8C%80%ED%95%99%EA%B5%90%20%EC%9D%BC%EC%86%A1%EA%B8%B0%EB%85%90%EB%8F%84%EC%84%9C%EA%B4%80' },
]

export default function VisitPage() {
  return (
    <Page title="Visit" className="pb-s10">
      <div className="page-x grid min-h-[100svh] grid-cols-1 content-center gap-s8 py-[calc(var(--top-bar)+24px)] md:grid-cols-12 md:gap-x-s5">
        <div className="flex flex-col gap-s6 md:col-span-6">
          <h1 className="t-page-title fg">Visit</h1>
          <div className="flex items-center gap-s4 fg md:gap-s5">
            <span className="t-date">12.01</span>
            <span aria-hidden="true" className="block h-px w-[clamp(48px,9vw,140px)] bg-current" />
            <span className="sr-only">부터</span>
            <span className="t-date">12.03</span>
          </div>
          <p className="t-lead fg">일송기념도서관 C.Square</p>
        </div>
        <div className="glass flex flex-col gap-s6 p-s5 md:col-span-5 md:p-s6 md:col-start-8 md:p-s7">
          <dl className="grid grid-cols-[56px_1fr] gap-x-s4 md:grid-cols-[72px_1fr] md:gap-x-s5 gap-y-s4">
            <dt className="t-label fg-soft pt-[4px]">기간</dt>
            <dd className="t-body fg">{EXHIBITION.periodParts.map(t => <span key={t}><span className="whitespace-nowrap">{t}</span> </span>)}</dd>
            <dt className="t-label fg-soft pt-[4px]">장소</dt>
            <dd className="t-body fg">{EXHIBITION.venue}</dd>
            <dt className="t-label fg-soft pt-[4px]">주소</dt>
            <dd className="t-body fg">{EXHIBITION.address}</dd>
            <dt className="t-label fg-soft pt-[4px]">기관</dt>
            <dd className="t-body fg">
              <ul>{EXHIBITION.partners.map(p => <li key={p}>{p}</li>)}</ul>
            </dd>
          </dl>
          <ul className="flex flex-wrap gap-s2">
            {MAPS.map(m => (
              <li key={m.url}>
                <a href={m.url} target="_blank" rel="noreferrer" className="glass btn-soft t-small fg">
                  {m.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Page>
  )
}
