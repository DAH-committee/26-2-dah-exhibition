// src/data/source.js — 작품 데이터와 관리자 기능의 단일 진입점
//
// VITE_DATA_SOURCE=demo  : 26-1 작품 데이터(src/data/demo)로 API 없이 동작
// 그 외(기본값 api)       : VITE_API_BASE 의 /exhibition-site/* 엔드포인트 사용
//
// 화면 코드는 fetch를 직접 쓰지 않고 이 파일의 api 객체만 사용한다.

import { API_BASE, SEMESTER, IS_DEMO, IS_STATIC } from '../config'
import { tokenStore, UNAUTHORIZED_EVENT } from './token'

export { tokenStore }

const TIMEOUT_MS = 15000
export const FALLBACK_KEYCOLOR = '#F5C518'

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// ── HTTP ──────────────────────────────────────────────────────

async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(API_BASE + path, window.location.origin)
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  })

  const token = tokenStore.get()
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'omit',
      signal: ctrl.signal,
    })
  } catch (err) {
    const timedOut = err?.name === 'AbortError'
    throw new ApiError(
      timedOut ? '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
               : '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.',
      0,
    )
  } finally {
    clearTimeout(timer)
  }

  let data = null
  const text = await res.text()
  if (text) {
    try { data = JSON.parse(text) } catch { data = null }
  }

  if (!res.ok) {
    if (res.status === 401 && token && !path.endsWith('/admin/login')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(data?.error || defaultMessage(res.status), res.status, data)
  }
  if (data === null) throw new ApiError('서버 응답을 해석할 수 없습니다.', res.status)
  return data
}

function defaultMessage(status) {
  if (status === 401) return '로그인이 필요합니다.'
  if (status === 403) return '권한이 없습니다.'
  if (status === 404) return '요청한 정보를 찾을 수 없습니다.'
  if (status === 409) return '이미 등록된 항목과 충돌합니다.'
  return `요청을 처리하지 못했습니다. (${status})`
}

// 서버는 시상 자리를 0부터 센다(최우수상 0, 우수상 0..N-1). 화면은 1부터 보여 주므로 여기서만 바꾼다.
const toUiSlot = item => (item ? { ...item, slot: item.rank === 'grand' ? 1 : Number(item.slot) + 1 } : item)
function fromServer(raw) {
  if (!raw) return raw
  const awards = raw.awards
    ? { ...raw.awards, grand: toUiSlot(raw.awards.grand), excellence: (raw.awards.excellence || []).map(toUiSlot) }
    : raw.awards
  const works = Array.isArray(raw.works)
    ? raw.works.map(w => (Number.isFinite(w.awardSlot) ? { ...w, awardSlot: w.award === 'grand' ? 1 : w.awardSlot + 1 } : w))
    : raw.works
  return { ...raw, awards, works }
}
const awardsFromServer = res => (res?.awards ? { ...res, awards: fromServer({ awards: res.awards }).awards } : res)

const liveApi = {
  getData: () => request('/exhibition-site/data', { query: { semester: SEMESTER } }).then(fromServer),
  login: (email, password) => request('/exhibition-site/admin/login', { method: 'POST', body: { email, password } }),
  me: () => request('/exhibition-site/admin/me'),
  setAward: ({ rank, slot, workId }) =>
    request('/exhibition-site/admin/awards', {
      method: 'PUT',
      body: { semester: SEMESTER, rank, slot: rank === 'grand' ? 0 : Number(slot) - 1, workId },
    }).then(awardsFromServer),
  deleteAward: id =>
    request(`/exhibition-site/admin/awards/${encodeURIComponent(id)}`, { method: 'DELETE', query: { semester: SEMESTER } }).then(awardsFromServer),
  updateSettings: settings =>
    request('/exhibition-site/admin/settings', { method: 'PUT', body: { semester: SEMESTER, ...settings } }),
  getStatus: () => request('/exhibition-site/admin/status', { query: { semester: SEMESTER } }),
  driveSync: () => request('/exhibition-site/admin/drive-sync', { method: 'POST', body: { semester: SEMESTER } }),
  createRubrics: (force = false) =>
    request('/exhibition-site/admin/rubrics', { method: 'POST', body: { semester: SEMESTER, force } }),
  updateProfessors: professors =>
    request('/exhibition-site/admin/professors', { method: 'PUT', body: { professors } }),
  share: () => request('/exhibition-site/admin/share', { method: 'POST', body: { semester: SEMESTER } }),
}

// 데모 모드는 26-1 데이터(약 100KB)를 별도 청크로 지연 로드한다.
let demoApiPromise = null
function demoApi() {
  demoApiPromise ??= import('./demo/demoApi.js').then(m => m.demoApi)
  return demoApiPromise
}

// 정적 모드는 저장소 안의 exhibition.json 하나만 읽는다. 관리자 기능은 쓰지 않는다.
let staticPromise = null
const staticData = () => (staticPromise ??= import('./static/exhibition.json').then(m => m.default))
const staticOnly = async () => { throw new ApiError('정적 모드에서는 지원하지 않습니다.', 0) }
const staticApi = Object.fromEntries(Object.keys(liveApi).map(key => [key, staticOnly]))
staticApi.getData = async () => {
  const raw = await staticData()
  // 과목 순서는 json의 subjects 순서, 과목 안에서는 id 순
  const order = new Map((raw.subjects ?? []).map((s, i) => [String(s.id), i]))
  const works = [...(raw.works ?? [])].sort((a, b) =>
    (order.get(String(a.subjectId)) ?? 999) - (order.get(String(b.subjectId)) ?? 999) || Number(a.id) - Number(b.id))
  return { ...raw, works }
}

export const api = IS_STATIC
  ? staticApi
  : IS_DEMO
  ? Object.fromEntries(Object.keys(liveApi).map(key => [key, async (...args) => (await demoApi())[key](...args)]))
  : liveApi

// ── 정규화 ────────────────────────────────────────────────────
// API 응답을 화면이 기대하는 형태로 맞춘다. 누락된 필드는 안전한 기본값으로 채운다.

const HEX = /^#[0-9a-f]{6}$/i

function normalizeWork(w) {
  return {
    id: String(w.id),
    subjectId: w.subjectId ?? '',
    subjectName: w.subjectName ?? '',
    title: w.title ?? '',
    author: w.author ?? '',
    members: Array.isArray(w.members) ? w.members : [],
    description: w.description ?? '',
    links: Array.isArray(w.links) ? w.links.filter(l => l?.url) : [],
    pages: Array.isArray(w.pages) ? w.pages.filter(Boolean) : [],
    keycolor: HEX.test(w.keycolor ?? '') ? w.keycolor : null,
    award: w.award === 'grand' || w.award === 'excellence' ? w.award : null,
    awardSlot: Number.isFinite(w.awardSlot) ? w.awardSlot : null,
    layout: w.layout,
    type: w.type,
  }
}

function normalizeAwards(raw, works) {
  const slots = Math.max(0, Number(raw?.excellenceSlots) || 0)
  let grand = raw?.grand ?? null
  let excellence = Array.isArray(raw?.excellence) ? raw.excellence.slice(0, slots) : []

  // awards 객체가 없으면 작품의 award 필드로 복원한다.
  if (!raw) {
    const g = works.find(w => w.award === 'grand')
    grand = g ? { id: `grand-${g.id}`, workId: g.id, subjectId: g.subjectId, subjectName: g.subjectName, rank: 'grand', slot: 1 } : null
    excellence = works
      .filter(w => w.award === 'excellence')
      .sort((a, b) => (a.awardSlot ?? 999) - (b.awardSlot ?? 999))
      .map(w => ({ id: `excellence-${w.id}`, workId: w.id, subjectId: w.subjectId, subjectName: w.subjectName, rank: 'excellence', slot: w.awardSlot }))
  }

  const count = raw ? slots : excellence.length
  while (excellence.length < count) excellence.push(null)
  return { excellenceSlots: count, grand: grand || null, excellence: excellence.map(x => x || null) }
}

export function normalizeData(raw) {
  const works = (Array.isArray(raw?.works) ? raw.works : []).map(normalizeWork)
  const subjects = (Array.isArray(raw?.subjects) ? raw.subjects : []).map(s => ({
    id: String(s.id),
    name: s.name ?? '',
    professor: s.professor ?? '',
    workCount: Number.isFinite(s.workCount) ? s.workCount : works.filter(w => w.subjectId === String(s.id)).length,
    description: s.description ?? '',
  }))
  return {
    meta: {
      semester: raw?.semester ?? SEMESTER,
      ordinal: raw?.ordinal ?? null,
      title: raw?.title ?? '',
      public: raw?.public !== false,
      viewerIsAdmin: !!raw?.viewerIsAdmin,
      updatedAt: raw?.updatedAt ?? null,
    },
    subjects,
    works,
    awards: normalizeAwards(raw?.awards, works),
  }
}
