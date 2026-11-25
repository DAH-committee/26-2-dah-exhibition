import Page from '../components/Page'
import { intro, committee, history } from '../data/lucid'

export default function LucidPage() {
  return (
    <Page title="LUCID" className="pb-s10">
      <div className="page-x grid grid-cols-1 gap-s8 pt-[calc(var(--top-bar)+8px)] md:grid-cols-12 md:gap-x-s5 md:pt-[calc(var(--top-bar)+16px)]">
        <div className="flex flex-col gap-s6 md:col-span-6">
          <h1 className="t-page-title fg">Lucid</h1>
          <p className="t-lead fg balance">{intro[0]}</p>
          {intro.slice(1).map(p => <p key={p} className="t-body fg max-w-text">{p}</p>)}
        </div>
        <section className="glass flex flex-col gap-s5 p-s6 md:col-span-5 md:col-start-8 md:p-s7" aria-label="2026 운영위원회">
          <h2 className="t-heading fg">2026 운영위원회</h2>
          <dl className="grid grid-cols-[80px_1fr] gap-x-s5 gap-y-s3">
            {committee.map(c => (
              <div key={c.role} className="contents">
                <dt className="t-label fg-soft pt-[4px]">{c.role}</dt>
                <dd className="t-body fg">{c.members.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <section className="page-x mt-s9" aria-label="연혁">
        <h2 className="t-heading fg">연혁</h2>
        <ol className="mt-s5 grid grid-cols-1 gap-s3 sm:grid-cols-2 lg:grid-cols-3">
          {history.map(h => (
            <li key={`${h.year}-${h.name}`} className="glass flex items-baseline gap-s4 p-s4">
              <span className="t-num fg-soft">{h.year}</span>
              <span className="flex min-w-0 flex-col">
                <span className="t-body fg font-medium lines-1">{h.name}</span>
                <span className="t-small fg-soft lines-2">{h.members.join(', ')}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </Page>
  )
}
