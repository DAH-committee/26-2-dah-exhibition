import SkyLink from '../SkyLink'
import { posterOf, thumbOf } from '../../utils'

export default function WorkCard({ work }) {
  const src = thumbOf(posterOf(work))
  return (
    <li>
      <SkyLink to={`/works/${work.id}`} className="glass lift group flex h-full flex-col gap-s3 p-s3">
        <div className="overflow-hidden rounded bg-night/40" style={{ aspectRatio: '1 / 1.414' }}>
          {src && (
            <img
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              width="560"
              height="792"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          )}
        </div>
        <div className="mt-auto flex flex-col gap-s1 px-s1 pb-s1">
          <h3 className="t-heading fg lines-2">{work.title}</h3>
          <p className="t-small fg-soft lines-1">{work.author}</p>
        </div>
      </SkyLink>
    </li>
  )
}
