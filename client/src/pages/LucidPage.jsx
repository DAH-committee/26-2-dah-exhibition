import Page from '../components/Page'
import { intro, committee, history } from '../data/lucid'

// 상자 없이 글과 사람 이름으로만 구성한다. 같은 위계의 글은 같은 크기(t-body)로 맞춘다
export default function LucidPage() {
  return (
    <Page title="LUCID" className="pb-s10">
      <div className="page-x grid grid-cols-1 gap-s8 pt-[calc(var(--top-bar)+8px)] md:grid-cols-12 md:gap-x-s5 md:pt-[calc(var(--top-bar)+16px)]">
        <div className="flex flex-col gap-s5 md:col-span-6">
          <h1 className="t-page-title fg">Lucid</h1>
          {intro.map(p => <p key={p} className="t-body fg max-w-text">{p}</p>)}
        </div>
        <section className="flex flex-col gap-s5 md:col-span-5 md:col-start-8 md:pt-s9" aria-label="2026 제1대 운영위원회">
          <h2 className="t-heading fg">2026 제1대 운영위원회 LUCID</h2>
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

      <section className="page-x mt-s9" aria-label="역대 학생회">
        <h2 className="t-heading fg">역대 학생회</h2>
        <ol className="mt-s5 grid grid-cols-1 gap-x-s7 gap-y-s3 md:grid-cols-2">
          {history.map(h => (
            <li key={`${h.year}-${h.name}`} className="grid grid-cols-[56px_1fr] gap-x-s4">
              <span className="t-num fg-soft pt-[2px]">{h.year}</span>
              <span className="t-body fg">
                {h.name}
                <span className="fg-soft">{'\u2003'}{h.members.join(', ')}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </Page>
  )
}
