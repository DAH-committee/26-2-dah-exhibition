import { Fragment, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Page from '../components/Page'
import SkyLink from '../components/SkyLink'
import Lightbox from '../components/Lightbox'
import { useExhibition } from '../data/useExhibition'
import { useSky } from '../sky/SkyProvider'
import { posterOf, thumbOf } from '../utils'

const KIND = { web: 'WEB', notion: 'NOTION', video: 'VIDEO', doc: 'DOC' }
// 첫 화면 아래 한 줄: 개인 작품은 이름, 팀 작품은 팀명
const byline = w => (w.members.length > 1 ? w.author : w.members[0]?.name || w.author) || ''

export default function WorkDetailPage() {
  const { id } = useParams()
  const { works, loaded } = useExhibition()
  const { ui } = useSky()
  const [zoom, setZoom] = useState(null)
  const close = useCallback(() => setZoom(null), [])
  const index = works.findIndex(w => w.id === id)
  const work = works[index]

  if (!loaded) return <Page title="Works" />
  if (!work) {
    return (
      <Page title="Works" className="page-x flex min-h-[100svh] flex-col justify-center gap-s5">
        <h1 className="t-page-title fg">Works</h1>
        <p className="t-body fg">존재하지 않는 작품</p>
        <SkyLink to="/works" className="t-nav fg text-link w-max">작품 목록</SkyLink>
      </Page>
    )
  }

  const next = works[(index + 1) % works.length]
  const poster = posterOf(work)
  const pages = work.pages

  return (
    <Page title={work.title} className="pb-s10">
      {/* 첫 화면: 포스터를 흐리게 깔고 가운데에 작품명(보고서 사례 페이지 첫 화면 구조) */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden page-x text-center">
        {poster && (
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <img src={thumbOf(poster)} alt="" className="h-full w-full scale-110 object-cover blur-[14px]" />
            <div className="absolute inset-0 bg-[rgba(9,18,42,0.55)]" />
          </div>
        )}
        <h1 className="t-case-title balance max-w-[1100px] text-paper" style={{ textShadow: '0 2px 30px rgba(6, 12, 28, 0.35)' }}>
          {work.title}
        </h1>
        <ul className="t-nav mt-s7 flex flex-wrap justify-center gap-x-s7 gap-y-s3 text-paper">
          <li>{work.subjectName}</li>
          {byline(work) && <li>{byline(work)}</li>}
        </ul>
        <p className="t-label absolute bottom-s7 left-1/2 hidden -translate-x-1/2 text-paper/80 md:block">SCROLL</p>
      </section>

      {/* 본문: 왼쪽 단(약 37%)에 작품 설명, 오른쪽 단(53% 지점부터)에 참여 학생과 정보 */}
      <section className="page-x mt-s7 grid grid-cols-1 gap-s6 md:grid-cols-12 md:gap-x-s5">
        <div className="md:col-span-5">
          <p className="t-lead fg balance">{work.description}</p>
        </div>
        <div className="flex flex-col gap-s5 md:col-span-5 md:col-start-7">
          <dl className="grid grid-cols-[72px_1fr] gap-x-s4 gap-y-s2">
            <dt className="t-label fg-soft pt-[3px]">과목</dt>
            <dd className="t-body fg">{work.subjectName}</dd>
            {work.members.length > 1 && work.author && (
              <>
                <dt className="t-label fg-soft pt-[3px]">팀</dt>
                <dd className="t-body fg">{work.author}</dd>
              </>
            )}
            <dt className="t-label fg-soft pt-[3px]">{work.members.length > 1 ? '팀원' : '이름'}</dt>
            <dd className="flex flex-col gap-s2">
              {work.members.map(m => (
                <span key={`${m.name}${m.studentId}`} className="flex flex-wrap items-baseline gap-x-s3">
                  <span className="t-body fg">{m.name}</span>
                  {m.studentId && <span className="t-small fg-soft">{m.studentId}</span>}
                  {m.major && <span className="t-small fg-soft">{m.major}</span>}
                </span>
              ))}
            </dd>
            {work.links.map(l => (
              <Fragment key={l.url}>
                <dt className="t-label fg-soft pt-[3px]">{KIND[l.kind] || 'LINK'}</dt>
                <dd>
                  <a href={l.url} target="_blank" rel="noreferrer" className="t-body fg text-link inline-flex items-center gap-s1" aria-label={`${l.label} 열기`}>
                    {l.label} <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </dd>
              </Fragment>
            ))}
          </dl>
        </div>
      </section>

      {pages.length > 0 && (
        <section className={`page-x mt-s7 grid gap-s4 ${pages.length > 1 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-12'}`} aria-label="작품 이미지">
          {pages.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setZoom(src)}
              className={`glass lift block overflow-hidden p-s2 ${pages.length > 1 ? '' : 'md:col-span-7'}`}
              aria-label={`${work.title} 이미지 ${i + 1} 크게 보기`}
            >
              <img src={src} alt={`${work.title} 이미지 ${i + 1}`} loading="lazy" decoding="async" className="w-full rounded" style={{ aspectRatio: '1 / 1.414', objectFit: 'cover' }} />
            </button>
          ))}
        </section>
      )}

      <nav className={`fixed inset-x-0 bottom-0 z-chrome flex items-center justify-between py-s5 ui-fade ${ui ? '' : 'ui-hidden'}`} style={{ paddingLeft: 'var(--page-x)', paddingRight: 'calc(var(--page-x) + var(--gutter))' }} aria-label="작품 이동">
        <button type="button" className="t-label fg py-s2" onClick={() => document.getElementById('scroller')?.scrollTo({ top: 0, behavior: 'smooth' })}>BACK TO TOP</button>
        {next && next.id !== work.id && (
          <SkyLink to={`/works/${next.id}`} className="t-label fg py-s2" aria-label={`다음 작품 ${next.title}`}>NEXT WORK</SkyLink>
        )}
      </nav>
      <Lightbox src={zoom} alt={work.title} onClose={close} />
    </Page>
  )
}
