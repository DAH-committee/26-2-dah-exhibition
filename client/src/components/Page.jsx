import { useEffect } from 'react'
import { useSky } from '../sky/SkyProvider'
import { pageTitle } from '../config'

// 페이지 껍데기: 전환 중에는 글자를 감추고, 제목을 바꾸고, 맨 위에서 시작한다.
export default function Page({ title, className = '', children, as: Tag = 'main' }) {
  const { ui } = useSky()
  useEffect(() => { document.title = pageTitle(title) }, [title])
  useEffect(() => { document.getElementById('scroller')?.scrollTo(0, 0) }, [])
  return (
    <Tag className={`${/\bfixed\b/.test(className) ? '' : 'relative'} z-page ui-fade ${ui ? '' : 'ui-hidden'} ${className}`}>
      {children}
    </Tag>
  )
}
