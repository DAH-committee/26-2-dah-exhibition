import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Chrome from './components/Chrome'
import HomePage from './pages/HomePage'
import IntroPage from './pages/IntroPage'

const WorksPage = lazy(() => import('./pages/WorksPage'))
const WorkDetailPage = lazy(() => import('./pages/WorkDetailPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const AwardsPage = lazy(() => import('./pages/AwardsPage'))
const VisitPage = lazy(() => import('./pages/VisitPage'))
const ContestPage = lazy(() => import('./pages/ContestPage'))
const LucidPage = lazy(() => import('./pages/LucidPage'))

export const VISITED_KEY = 'dah26-2:visited'

function hasVisited() {
  try { return window.localStorage.getItem(VISITED_KEY) === '1' } catch { return true }
}

// 첫 화면 /은 바로 홈을 보여 주되, 처음 온 사람은 /intro로 보낸다
function Home() {
  if (!hasVisited()) return <Navigate to="/intro" replace />
  return <HomePage />
}

export default function App() {
  return (
    <>
      <Chrome />
      <div id="scroller">
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/intro" element={<IntroPage />} />
          <Route path="/works" element={<WorksPage />} />
          <Route path="/works/:id" element={<WorkDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/awards" element={<AwardsPage />} />
          <Route path="/visit" element={<VisitPage />} />
          <Route path="/contest" element={<ContestPage />} />
          <Route path="/lucid" element={<LucidPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </div>
    </>
  )
}
