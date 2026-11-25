import { useSky } from '../sky/SkyProvider'

// 사이트 안 링크. 누르면 그 장면으로 날아간다(장면 전환 연출).
export default function SkyLink({ to, onClick, children, ...rest }) {
  const { flyTo } = useSky()
  return (
    <a
      href={to}
      onClick={e => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        flyTo(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
