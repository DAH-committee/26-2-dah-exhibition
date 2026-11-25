import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Page from '../components/Page'
import WorkCard from '../components/works/WorkCard'
import Constellation from '../components/works/Constellation'
import { useExhibition } from '../data/useExhibition'

const chip = active =>
  `t-small shrink-0 rounded px-s3 py-s2 transition-[background-color,box-shadow] duration-300 ${
    active ? 'glass glass-strong fg font-semibold shadow-e1' : 'fg-soft hover:text-[var(--fg)]'
  }`

export default function WorksPage() {
  const { works, subjects, loaded } = useExhibition()
  const [params, setParams] = useSearchParams()
  const subject = params.get('subject') ?? 'all'
  const view = params.get('view') === 'stars' ? 'stars' : 'grid'

  const groups = useMemo(
    () => subjects.map(s => ({ subject: s, works: works.filter(w => w.subjectId === s.id) })).filter(g => g.works.length),
    [works, subjects],
  )
  const shown = subject === 'all' ? works : works.filter(w => w.subjectId === subject)
  const shownGroups = subject === 'all' ? groups : groups.filter(g => g.subject.id === subject)

  const set = (k, v) => {
    const next = new URLSearchParams(params)
    if (v === null) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  return (
    <Page title="Works" className="pb-s9" >
      <div className="page-x pt-[calc(var(--top-bar)+4px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-s7 gap-y-s3">
          <h1 className="t-case-title fg">Works</h1>
          <div className="flex items-center gap-s1" role="group" aria-label="보기 방식">
            <button type="button" className={chip(view === 'grid')} aria-pressed={view === 'grid'} onClick={() => set('view', null)}>격자</button>
            <button type="button" className={chip(view === 'stars')} aria-pressed={view === 'stars'} onClick={() => set('view', 'stars')}>별자리</button>
          </div>
        </div>
        <div className="no-scrollbar -mx-page mt-s4 overflow-x-auto px-page md:mx-0 md:overflow-visible md:px-0">
          <div className="flex w-max gap-s1 md:w-auto md:flex-wrap" role="group" aria-label="과목">
            <button type="button" className={chip(subject === 'all')} aria-pressed={subject === 'all'} onClick={() => set('subject', null)}>
              전체 <span className="t-num opacity-70">({works.length})</span>
            </button>
            {groups.map(g => (
              <button
                key={g.subject.id}
                type="button"
                className={chip(subject === g.subject.id)}
                aria-pressed={subject === g.subject.id}
                onClick={() => set('subject', g.subject.id)}
              >
                {g.subject.name} <span className="t-num opacity-70">({g.works.length})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-x mt-s5">
        {!loaded ? null : view === 'grid' ? (
          <ul className="grid grid-cols-2 gap-s3 md:grid-cols-3 md:gap-s4 lg:grid-cols-4 xl:grid-cols-6 3xl:grid-cols-7">
            {shown.map(w => <WorkCard key={w.id} work={w} />)}
          </ul>
        ) : (
          <Constellation groups={shownGroups} />
        )}
      </div>
    </Page>
  )
}
