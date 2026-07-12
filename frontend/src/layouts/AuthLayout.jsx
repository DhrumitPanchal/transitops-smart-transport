import { Outlet } from 'react-router-dom'
import env from '../config/env'
import Card from '../components/common/Card'

export default function AuthLayout() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">
            {env.appName}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Smart Transport Operations Platform
          </p>
        </div>
        <Card>
          <Outlet />
        </Card>
      </div>
    </div>
  )
}
