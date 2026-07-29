import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  return (
    <div data-app-shell="true" className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar />

      <div data-app-shell-content="true" className="min-h-screen lg:pl-72">
        <Topbar />

        <main data-app-main="true" className="px-5 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}