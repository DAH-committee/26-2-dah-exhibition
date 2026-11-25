// src/data/useExhibition.jsx — 작품 데이터 컨텍스트
//
// 앱 시작 시 /exhibition-site/data 를 한 번 불러와 모든 페이지가 공유한다.
// refresh()        : 다시 불러오기 (로딩 표시 있음)
// refresh({ silent: true }) : 백그라운드 갱신 (폴링용, 기존 화면 유지)

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, normalizeData } from './source'
import { subjectDescriptions } from './subjectDescriptions'
import { IS_STATIC } from '../config'

const ExhibitionContext = createContext(null)

const POLL_MS = 60 * 1000
const ALL_SUBJECT = { id: 'all', name: 'ALL', professor: '', description: '', workCount: 0 }

export function ExhibitionProvider({ children }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const seq = useRef(0)
  const lastRaw = useRef('')

  const refresh = useCallback(async ({ silent = false } = {}) => {
    const id = ++seq.current
    if (!silent) setLoading(true)
    try {
      const raw = await api.getData()
      if (id !== seq.current) return
      // 내용이 같으면 상태를 바꾸지 않아 불필요한 리렌더를 막는다.
      const { updatedAt, ...rest } = raw ?? {}
      const fingerprint = JSON.stringify(rest)
      if (fingerprint !== lastRaw.current) {
        lastRaw.current = fingerprint
        setData(normalizeData(raw))
      }
      setError(null)
    } catch (err) {
      if (id !== seq.current) return
      setError(err)
    } finally {
      if (id === seq.current) setLoading(false)
    }
  }, [])

  // 관리자 로그아웃·인증 만료: 공개 전이라면 관리자에게만 보이던 작품을 바로 지우고, 진행 중인 관리자 요청 결과는 버린다
  const clearPrivate = useCallback(() => {
    seq.current++
    lastRaw.current = ''
    setData(d => (d && d.meta && !d.meta.public ? { ...d, works: [], meta: { ...d.meta, viewerIsAdmin: false } } : d))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // 접수자가 작품 정보를 고치면 열려 있는 모든 페이지에 반영되도록 1분마다, 그리고 탭으로 돌아올 때 조용히 다시 불러온다.
  useEffect(() => {
    if (IS_STATIC) return undefined // 정적 모드는 주기 갱신 없음
    const visible = () => document.visibilityState === 'visible'
    const timer = setInterval(() => { if (visible()) refresh({ silent: true }) }, POLL_MS)
    const onVisibility = () => { if (visible()) refresh({ silent: true }) }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refresh])

  const value = useMemo(() => {
    const works = data?.works ?? []
    const subjects = (data?.subjects ?? []).map(s => ({
      ...s,
      description: subjectDescriptions[s.id] ?? subjectDescriptions[s.name] ?? s.description ?? '',
    }))
    return {
      works,
      subjects,
      filterSubjects: [{ ...ALL_SUBJECT, workCount: works.length }, ...subjects],
      awards: data?.awards ?? { excellenceSlots: 0, grand: null, excellence: [] },
      meta: data?.meta ?? null,
      loaded: !!data,
      loading,
      error,
      refresh,
      clearPrivate,
    }
  }, [data, loading, error, refresh, clearPrivate])

  return <ExhibitionContext.Provider value={value}>{children}</ExhibitionContext.Provider>
}

export function useExhibition() {
  const ctx = useContext(ExhibitionContext)
  if (!ctx) throw new Error('useExhibition must be used inside <ExhibitionProvider>')
  return ctx
}
