import { useState } from 'react'
import Page from '../components/Page'
import Lightbox from '../components/Lightbox'
import { EXHIBITION, POSTER_STORY } from '../data/exhibition'

export default function ContestPage() {
  const [zoom, setZoom] = useState(false)
  const { poster } = EXHIBITION
  return (
    <Page title="Contest" className="pb-s10">
      <div className="page-x grid grid-cols-1 gap-s8 pt-[calc(var(--top-bar)+8px)] md:grid-cols-12 md:gap-x-s5 md:pt-[calc(var(--top-bar)+16px)]">
        <figure className="md:col-span-5">
          <button type="button" onClick={() => setZoom(true)} className="glass lift block w-full p-s3" aria-label="포스터 크게 보기">
            <img src={poster.src} alt="포스터 One Star per House" width="1414" height="2000" className="w-full rounded" style={{ aspectRatio: '1414 / 2000' }} />
          </button>
        </figure>
        <div className="flex flex-col gap-s6 md:col-span-6 md:col-start-7 md:pt-s8">
          <h1 className="t-page-title fg">Contest</h1>
          <dl className="grid grid-cols-[72px_1fr] gap-x-s5 gap-y-s3">
            <dt className="t-label fg-soft pt-[4px]">공모전</dt>
            <dd className="t-body fg">2026-2 전시회 포스터 공모전</dd>
            <dt className="t-label fg-soft pt-[4px]">최우수상</dt>
            <dd className="t-body fg">「{poster.title}」, {poster.author}</dd>
          </dl>
          <h2 className="t-serif-title fg">{poster.title}</h2>
          {POSTER_STORY.map(p => <p key={p} className="t-body fg max-w-text">{p}</p>)}
          <p className="t-body fg max-w-text">이 포스터의 색과 장면이 전시 사이트의 하늘과 구름, 별자리가 되었습니다.</p>
        </div>
      </div>
      <Lightbox src={zoom ? poster.src : null} alt="포스터 One Star per House" onClose={() => setZoom(false)} />
    </Page>
  )
}
