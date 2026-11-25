// src/data/demo/demoApi.js — API 없이 화면을 확인하기 위한 데모 백엔드
//
// 26-1 작품 데이터(works.js, subjects.js, keycolors.json)를 API 응답 형태로 바꿔 돌려준다.
// 이미지는 26-1 배포 사이트에서 불러온다. 관리자 기능은 브라우저 메모리에서만 동작하며
// 새로고침하면 초기 상태(26-1 실제 수상 결과)로 돌아간다.

import { works as rawWorks } from './works'
import { subjects as rawSubjects } from './subjects'
import keycolors from './keycolors.json'
import { tokenStore } from '../token'
import { SEMESTER } from '../../config'
import { DEMO_IMAGE_BASE } from './constants'

const DEMO_TOKEN = 'demo-admin-token'

// 26-1 시상식 당시 우수상 발표 순서 (데모 초기 상태 전용)
const DEMO_EXCELLENCE_ORDER = ['010', '052', '003', '018', '020', '077', '015', '062', '063', '073', '036', '026', '088']

function keyOf(src) {
  return (src ?? '').replace('/works/', '').replace(/\.webp$/, '')
}

const works = rawWorks.map(w => ({
  id: w.id,
  subjectId: w.subjectId,
  subjectName: w.subjectName,
  title: w.title,
  author: w.author,
  members: w.members ?? [],
  description: w.description ?? '',
  links: w.links ?? [],
  pages: (w.pages ?? []).map(p => (p.startsWith('/') ? DEMO_IMAGE_BASE + p : p)),
  keycolor: keycolors[keyOf(w.pages?.[0])] ?? null,
  layout: w.layout,
  originalAward: w.award,
}))

const subjects = rawSubjects
  .filter(s => s.id !== 'all')
  .map(s => ({
    id: s.id,
    name: s.name,
    professor: s.professor,
    description: s.description,
    workCount: works.filter(w => w.subjectId === s.id).length,
  }))

function makeItem(work, rank, slot) {
  return { id: `${rank}-${slot}`, workId: work.id, subjectId: work.subjectId, subjectName: work.subjectName, rank, slot }
}

function initialState() {
  const grandWork = works.find(w => w.originalAward === 'grand')
  const exWorks = works
    .filter(w => w.originalAward === 'excellence')
    .sort((a, b) => {
      const ai = DEMO_EXCELLENCE_ORDER.indexOf(a.id)
      const bi = DEMO_EXCELLENCE_ORDER.indexOf(b.id)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
  return {
    public: true,
    excellenceSlots: exWorks.length,
    grand: grandWork ? makeItem(grandWork, 'grand', 1) : null,
    excellence: exWorks.map((w, i) => makeItem(w, 'excellence', i + 1)),
    professors: Object.fromEntries(subjects.map(s => [s.name, { name: s.professor, emails: [] }])),
  }
}

let state = initialState()

const wait = (ms = 150) => new Promise(r => setTimeout(r, ms))

function conflict(message) {
  const err = new Error(message)
  err.name = 'ApiError'
  err.status = 409
  return err
}
function unauthorized() {
  const err = new Error('로그인이 필요합니다.')
  err.name = 'ApiError'
  err.status = 401
  return err
}

const isAdmin = () => tokenStore.get() === DEMO_TOKEN
function requireAdmin() {
  if (!isAdmin()) throw unauthorized()
}

function awardsPayload() {
  const excellence = Array.from({ length: state.excellenceSlots }, (_, i) => state.excellence[i] ?? null)
  return { excellenceSlots: state.excellenceSlots, grand: state.grand, excellence }
}

function allItems() {
  return [state.grand, ...state.excellence].filter(Boolean)
}

export const demoApi = {
  async getData() {
    await wait()
    const awards = awardsPayload()
    const byWork = new Map(allItems().map(it => [it.workId, it]))
    const visible = state.public || isAdmin()
    return {
      semester: SEMESTER,
      ordinal: 18,
      title: 'Against the Flow (데모)',
      public: state.public,
      viewerIsAdmin: isAdmin(),
      subjects,
      works: visible
        ? works.map(({ originalAward, ...w }) => {
            const it = byWork.get(w.id)
            return { ...w, award: it?.rank ?? null, awardSlot: it?.slot ?? null }
          })
        : [],
      awards,
      updatedAt: new Date().toISOString(),
    }
  },

  async login(email, password) {
    await wait(300)
    if (!email || !password) {
      const err = new Error('이메일과 비밀번호를 입력해 주세요.')
      err.status = 401
      throw err
    }
    return { token: DEMO_TOKEN, user: { name: '데모 관리자', email, role: 'admin' }, expiresIn: 3600 }
  },

  async me() {
    await wait()
    requireAdmin()
    return { user: tokenStore.getUser() ?? { name: '데모 관리자', email: '', role: 'admin' } }
  },

  async setAward({ rank, slot, workId }) {
    await wait(300)
    requireAdmin()
    const work = works.find(w => w.id === workId)
    if (!work) throw conflict('작품을 찾을 수 없습니다.')
    const current = rank === 'grand' ? state.grand : state.excellence[slot - 1]
    if (current) throw conflict('이미 수상작이 등록된 자리입니다.')
    if (allItems().some(it => it.subjectId === work.subjectId)) throw conflict('이 과목은 이미 수상작이 있습니다.')
    const item = makeItem(work, rank, slot)
    if (rank === 'grand') state.grand = item
    else state.excellence[slot - 1] = item
    return { awards: awardsPayload() }
  },

  async deleteAward(id) {
    await wait(200)
    requireAdmin()
    if (state.grand?.id === id) state.grand = null
    state.excellence = state.excellence.map(it => (it?.id === id ? null : it))
    return { awards: awardsPayload() }
  },

  async updateSettings(settings) {
    await wait()
    requireAdmin()
    if (typeof settings.public === 'boolean') state.public = settings.public
    if (Number.isFinite(settings.excellenceSlots)) {
      state.excellenceSlots = Math.max(0, settings.excellenceSlots)
      state.excellence = state.excellence.slice(0, state.excellenceSlots)
    }
    return { settings: { public: state.public, excellenceSlots: state.excellenceSlots } }
  },

  async getStatus() {
    await wait()
    requireAdmin()
    return {
      settings: { public: state.public, excellenceSlots: state.excellenceSlots },
      drive: { connected: false, account: '', queued: 0, synced: 0, failed: 0, lastError: '데모 모드에서는 드라이브에 연결하지 않습니다.' },
      rubrics: [],
      professors: state.professors,
      courses: subjects.map(s => s.name),
    }
  },

  async driveSync() {
    await wait(400)
    requireAdmin()
    return { synced: 0, failed: 0 }
  },

  async createRubrics() {
    await wait(400)
    requireAdmin()
    return { created: [], skipped: subjects.map(s => s.name), master: null }
  },

  async updateProfessors(professors) {
    await wait()
    requireAdmin()
    state.professors = professors
    return { professors }
  },

  async share() {
    await wait(400)
    requireAdmin()
    return { shared: [], failed: [{ course: '데모', error: '데모 모드에서는 공유하지 않습니다.' }] }
  },
}
