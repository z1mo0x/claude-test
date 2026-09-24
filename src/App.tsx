import { Route, Routes } from 'react-router'

import { PageTransitionProvider, ScrollManager } from '@/components/transition/page-transition'
import { HomePage } from '@/pages/home'
import { NotFoundPage } from '@/pages/not-found'
import { ProjectPage } from '@/pages/project'

export default function App() {
  return (
    <PageTransitionProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {/* After <Routes> so its effect runs once the new page (and ScrollExpand's measured height) is in place. */}
      <ScrollManager />
    </PageTransitionProvider>
  )
}
