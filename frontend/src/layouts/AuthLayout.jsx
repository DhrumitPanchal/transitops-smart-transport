import { Outlet } from 'react-router-dom'
import env from '../config/env'

export default function AuthLayout() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">
            {env.appName}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Smart Transport Operations Platform
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
