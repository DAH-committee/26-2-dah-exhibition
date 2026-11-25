# 26-2 전시회 웹사이트 (템플릿)

26-1 전시회 웹사이트(Against the Flow)를 복사해 만든 템플릿이다. 화면 구성과 디자인은 26-1과 같고, 작품 데이터는 코드에 들어 있지 않다. 작품, 과목, 수상 결과는 모두 API(`/exhibition-site/*`)에서 자동으로 불러온다.

학기마다 할 일은 두 가지다.

1. 컨셉에 맞게 화면을 다시 꾸민다.
2. Vercel에 배포한다.

작품을 추가하거나 수정하려고 코드를 고칠 필요는 없다.

## 폴더 구조

```
26-2 전시회 웹사이트/
├─ vercel.json            # Vercel 빌드 설정 (client 폴더를 빌드)
├─ README.md
├─ *.md                   # 26-1 설계 문서 (DESIGN, IA, COMPONENTS 등, 참고용)
└─ client/                # Vite + React 18 + Tailwind
   ├─ .env.example        # 환경 변수 예시
   ├─ .env.demo           # 데모 모드 설정 (npm run dev:demo 에서 사용)
   └─ src/
      ├─ config.js        # 환경 변수, 사이트 이름, 컨셉 제목
      ├─ data/
      │  ├─ source.js            # API 호출과 응답 정리 (화면은 이 파일만 사용)
      │  ├─ useExhibition.jsx    # 작품 데이터 컨텍스트와 useExhibition 훅
      │  ├─ useAdmin.jsx         # 관리자 로그인 상태
      │  ├─ token.js             # 관리자 토큰 보관 (sessionStorage)
      │  ├─ subjectDescriptions.js  # 과목 소개 문구 (선택, 직접 채움)
      │  ├─ demo/                # 26-1 작품 데이터와 데모용 가짜 API
      │  └─ about.js, against.js, contests.js, history.js, lucid.js  # 소개 페이지 문구
      ├─ pages/            # About, Against, Projects, ProjectDetail, Contest, Award, Lucid, Gallery, Admin
      └─ components/
```

## 환경 변수

`client/.env.example` 을 `client/.env.local` 로 복사해 값을 바꾼다. Vercel에서는 Project Settings > Environment Variables 에 같은 이름으로 넣는다.

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `VITE_API_BASE` | `https://dah-hallym.vercel.app/api` | API 주소. 끝에 `/` 를 붙이지 않는다. |
| `VITE_SEMESTER` | `2026-2` | 전시 학기. 헤더의 `26-2 DAH EXHIBITION` 도 이 값으로 만든다. |
| `VITE_DATA_SOURCE` | `api` | `demo` 로 바꾸면 API 없이 26-1 작품으로 화면을 확인한다. |

환경 변수는 빌드할 때 코드에 들어간다. 값을 바꾸면 다시 빌드(또는 Vercel 재배포)해야 반영된다.

## 실행

```bash
cd client
npm install
npm run dev          # API 모드, http://localhost:5173
npm run dev:demo     # 데모 모드
npm run build        # 배포용 빌드 (client/dist)
npm run build:demo   # 데모 모드로 빌드
```

## 데모 모드

API가 아직 준비되지 않았거나 디자인만 바꿀 때 쓴다.

- `src/data/demo/` 의 26-1 작품 90개, 과목 13개, 키컬러를 사용한다.
- 이미지는 26-1 배포 사이트(`https://26-1-dah-exhibition.vercel.app/works/...`)에서 불러온다. 이 저장소에는 작품 이미지가 없다.
- Award 페이지에는 26-1 실제 수상 결과(최우수상 1, 우수상 13)가 나온다.
- 관리자 로그인은 아무 이메일과 비밀번호로 된다. 수상 등록과 취소, 공개 설정은 브라우저 메모리에서만 바뀌고 새로고침하면 처음 상태로 돌아간다. 시상식 리허설용으로 쓸 수 있다.
- 데모 데이터는 별도 파일로 분리되어 있어 API 모드 빌드에는 포함되지 않는다.

## 데이터 흐름

`useExhibition()` 훅 하나로 모든 페이지가 같은 데이터를 쓴다.

```jsx
const { works, subjects, filterSubjects, awards, meta, loading, error, refresh } = useExhibition()
```

- 앱이 열릴 때 `GET /exhibition-site/data?semester=...` 를 한 번 부른다.
- `works`: 작품 목록. 이미지(`pages`)는 API가 준 주소를 그대로 쓴다. 카드 색은 `work.keycolor`, 없으면 노란색(`#F5C518`).
- `subjects`: 과목 목록 (`name`, `professor`, `workCount`). `filterSubjects` 는 맨 앞에 `ALL` 이 붙은 필터용 목록이다.
- `awards`: `{ excellenceSlots, grand, excellence[] }`. 우수상 순서는 자리 번호(awardSlot) 순이다.
- `meta.public` 이 `false` 이고 관리자가 아니면 작품이 비어서 오고, 화면에는 "작품은 전시 개막과 함께 공개됩니다" 가 보인다.
- `refresh()` 는 다시 불러오기, `refresh({ silent: true })` 는 화면을 유지한 채 백그라운드로 갱신한다.
- 네트워크 오류가 나면 Projects, Award 페이지에 오류 문구와 "다시 시도" 버튼이 나온다.

과목 소개 문구가 필요하면 `src/data/subjectDescriptions.js` 에 과목명이나 과목 id를 키로 적는다. 비워 두면 과목명과 지도교수만 보인다.

## 다시 꾸밀 곳

| 바꿀 것 | 위치 |
| --- | --- |
| 전시 제목(컨셉), 브라우저 탭 제목 | `src/config.js` 의 `CONCEPT_TITLE` |
| 공유 미리보기(og 태그) | `client/index.html` |
| 색, 글꼴, 간격 | `client/tailwind.config.js`, `src/index.css`, `src/styles/tokens.js` |
| 메뉴 | `src/components/layout/Header.jsx`, `MobileMenu.jsx` |
| About, 컨셉 페이지 문구 | `src/data/about.js`, `src/data/against.js`, `src/data/history.js` |
| 공모전, LUCID 페이지 | `src/data/contests.js`, `src/data/lucid.js` |
| 컨셉 이미지, 포스터 | `client/public/against/`, `client/public/contest/` |
| 푸터 문구 | `src/components/layout/Footer.jsx` (관리자 링크는 지우지 않는다) |
| 작품 카드, 상세 화면 | `src/components/project/` |
| 수상 카드("?" 카드와 뒤집히는 연출) | `src/components/award/AwardSlot.jsx` |

`src/data/source.js`, `useExhibition.jsx`, `useAdmin.jsx` 는 API와 연결된 부분이라 디자인 작업 중에는 건드리지 않는 편이 안전하다.

## Vercel 배포

26-1과 같은 방식이다. 저장소 루트의 `vercel.json` 이 `client` 폴더를 빌드한다.

```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

1. 이 폴더를 GitHub 저장소로 올린다. (지금은 로컬 git 커밋만 있고 원격 저장소는 없다.)
2. Vercel에서 New Project로 저장소를 가져온다. Root Directory는 저장소 루트 그대로 둔다.
3. Environment Variables 에 `VITE_API_BASE`, `VITE_SEMESTER` 를 넣는다. `VITE_DATA_SOURCE` 는 넣지 않거나 `api` 로 둔다.
4. Deploy. 새로고침해도 404가 나지 않도록 rewrites 가 이미 들어 있다.

Root Directory를 `client` 로 지정하는 방식도 된다. 이때는 `client/vercel.json` 의 rewrites 가 쓰이고, 빌드 명령은 기본값(`npm run build`), 출력 폴더는 `dist` 다.

### CORS

사이트와 API의 도메인이 다르므로 API 서버가 사이트 주소를 CORS로 허용해야 한다. 이 처리는 서버(dah-hallym) 쪽에서 한다. 사이트는 쿠키를 쓰지 않고 `Authorization: Bearer <토큰>` 헤더만 보낸다. 새 도메인으로 배포하면 서버 담당자에게 주소를 알려 허용 목록에 넣는다.

## 관리자 사용법

### 로그인

- 푸터 왼쪽 아래의 작은 "관리자" 를 누르면 로그인 창이 열린다. `/admin` 으로 바로 들어가도 된다.
- 토큰은 sessionStorage 에 저장되어 탭을 닫으면 로그아웃된다.
- 로그인하면 푸터에 "관리자 페이지", "로그아웃" 이 보인다.

### /admin 페이지

- **사이트 작품 공개**: 끄면 방문자에게 작품이 보이지 않는다. 관리자는 꺼져 있어도 작품을 본다. 전시 개막 때 켠다.
- **우수상 자리 수**: Award 페이지의 우수상 칸 수. 추천값은 작품이 있는 과목 수에서 1(최우수상)을 뺀 값이다.
- **구글 드라이브**: 연결 상태와 대기, 완료, 실패 건수. "드라이브 동기화" 로 바로 옮긴다.
- **채점기준표**: 과목별 시트 링크. "채점기준표 만들기" 는 없는 과목만 만들고, "다시 만들기" 는 전부 새로 만든다.
- **교수님 정보**: 과목별 성함과 이메일(쉼표로 구분)을 적고 "저장". "교수님께 폴더 공유" 는 저장된 이메일로 과목 폴더를 공유하고 결과를 과목별로 보여준다.

### 시상식 진행 (/award)

1. 발표용 화면(프로젝터)에서 `/award` 를 열어 둔다. 로그인하지 않아도 된다. 탭이 보이는 동안 5초마다 자동으로 새로 불러오고, 수상작이 등록되면 "?" 카드가 뒤집히며 작품이 나타난다.
2. 진행 담당은 다른 기기(노트북, 휴대폰)에서 관리자로 로그인하고 `/award` 를 연다.
3. 발표할 자리의 "?" 카드를 누른다.
   - 1단계: 과목 선택. 이미 수상작이 있는 과목은 "수상 완료" 로 막혀 있다.
   - 2단계: 작품 선택. 첫 페이지 이미지, 제목, 작성자가 보인다.
   - 확인: "이 작품을 우수상 3번 자리에 등록할까요?" 에서 "등록".
4. 등록 즉시 진행 화면이 갱신되고, 발표 화면에는 5초 안에 반영된다.
5. 잘못 등록했으면 해당 카드의 "취소" 를 누른다.
6. 같은 과목에 두 번 등록하거나 이미 찬 자리에 등록하면 서버가 거절하고(409) 창 안에 이유가 보인다.

시상식 전에 `npm run dev:demo` 로 같은 흐름을 연습할 수 있다.

## 기타

- 26-1 작품 이미지(281MB)는 복사하지 않았다. 26-1 썸네일 생성 스크립트(make-thumbnails, make-detail, extract-colors)도 더 이상 필요 없어 뺐다.
- 루트의 `AGENTS.md`, `DESIGN.md`, `IA.md`, `COMPONENTS.md`, `PATTERNS.md`, `ROUTES.md`, `SETUP.md`, `PROGRESS.md`, `claude.md` 는 26-1 작업 기록이다. 디자인 규칙을 참고할 때 쓴다.
