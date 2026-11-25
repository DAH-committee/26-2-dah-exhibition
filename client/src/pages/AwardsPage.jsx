import Page from '../components/Page'
import WorkCard from '../components/works/WorkCard'
import { useExhibition } from '../data/useExhibition'

export default function AwardsPage() {
  const { awards, works } = useExhibition()
  const byId = id => works.find(w => w.id === String(id))
  const grand = awards.grand?.workId ? byId(awards.grand.workId) : null
  const excellence = awards.excellence.map(a => (a?.workId ? byId(a.workId) : null)).filter(Boolean)
  const announced = Boolean(grand || excellence.length)

  return (
    <Page title="Awards" className="pb-s10">
      <div className="page-x flex min-h-[100svh] flex-col justify-center gap-s7 py-[calc(var(--top-bar)+24px)]">
        <h1 className="t-page-title fg">Awards</h1>
        {announced ? (
          <>
            {grand && (
              <section className="flex flex-col gap-s4">
                <h2 className="t-heading fg">최우수상</h2>
                <ul className="grid grid-cols-2 gap-s4 md:grid-cols-4 xl:grid-cols-5"><WorkCard work={grand} /></ul>
              </section>
            )}
            {excellence.length > 0 && (
              <section className="flex flex-col gap-s4">
                <h2 className="t-heading fg">우수상</h2>
                <ul className="grid grid-cols-2 gap-s4 md:grid-cols-4 xl:grid-cols-5">{excellence.map(w => <WorkCard key={w.id} work={w} />)}</ul>
              </section>
            )}
          </>
        ) : (
          <div className="glass grid max-w-[880px] grid-cols-1 gap-s6 p-s6 md:grid-cols-[1fr_auto] md:items-end md:p-s7">
            <div className="flex flex-col gap-s3">
              <p className="t-label fg-soft">전시회 시상식 실시간 공개</p>
              <p className="t-case-title fg">12.03 18:00</p>
            </div>
            <dl className="flex gap-s7">
              <div className="flex flex-col gap-s1">
                <dt className="t-label fg-soft">최우수상</dt>
                <dd className="t-date fg">1</dd>
              </div>
              <div className="flex flex-col gap-s1">
                <dt className="t-label fg-soft">우수상</dt>
                <dd className="t-date fg">{awards.excellenceSlots}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </Page>
  )
}
