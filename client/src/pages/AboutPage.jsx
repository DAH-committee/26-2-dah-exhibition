import { useState } from 'react'
import Page from '../components/Page'
import Lightbox from '../components/Lightbox'
import { EXHIBITION, POSTER_STORY } from '../data/exhibition'

// 한 화면 구성: 왼쪽은 화면 높이에 맞춘 포스터 전체, 오른쪽은 전시 소개와 기본 정보
export default function AboutPage() {
  const [zoom, setZoom] = useState(false)

  return (
    <Page title="About">
      <div className="page-x grid grid-cols-1 gap-s7 pb-s8 pt-[calc(var(--top-bar)+8px)] md:h-[100svh] md:grid-cols-[auto_1fr] md:items-center md:gap-x-s8 md:pb-s6">
        <figure className="md:h-full md:max-h-[calc(100svh-var(--top-bar)-32px)]">
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="glass lift block w-full p-s2 md:h-full md:w-auto"
            style={{ aspectRatio: '1414 / 2000' }}
            aria-label="포스터 크게 보기"
          >
            <img
              src={EXHIBITION.poster.src}
              alt="포스터 One Star per House: 분홍 구름 아래 옥상에 오른 사람들이 실에 매단 별을 하늘에 다는 장면"
              width="1414"
              height="2000"
              className="h-full w-full rounded object-cover"
            />
          </button>
        </figure>

        <div className="flex max-w-[640px] flex-col gap-s5">
          <p className="t-label fg-soft">{EXHIBITION.title}</p>
          <h1 className="t-serif-title fg">One Star per House</h1>
          {POSTER_STORY.map(p => <p key={p} className="t-body fg-soft">{p}</p>)}
          <dl className="mt-s2 grid grid-cols-[56px_1fr] gap-x-s4 gap-y-s2">
            <dt className="t-label fg-soft pt-[5px]">기간</dt>
            <dd className="t-body fg">{EXHIBITION.periodParts.map(t => <span key={t}><span className="whitespace-nowrap">{t}</span> </span>)}</dd>
            <dt className="t-label fg-soft pt-[5px]">장소</dt>
            <dd className="t-body fg">{EXHIBITION.venue}</dd>
            <dt className="t-label fg-soft pt-[5px]">포스터</dt>
            <dd className="t-body fg">{EXHIBITION.poster.award}, {EXHIBITION.poster.author}</dd>
          </dl>
        </div>
      </div>
      <Lightbox src={zoom ? EXHIBITION.poster.src : null} alt="포스터 One Star per House" onClose={() => setZoom(false)} />
    </Page>
  )
}
