import { Menu } from 'lucide-react'
import IconButton from '../common/IconButton'
import UserMenu from './UserMenu'
import Breadcrumbs from './Breadcrumbs'

export default function TopHeader({
  onMenuClick,
  title = 'Operations Console',
  subtitle = 'Smart transport management',
  breadcrumbs,
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton
          icon={Menu}
          label="Open sidebar"
          className="lg:hidden"
          onClick={onMenuClick}
        />
        <div className="min-w-0">
          {breadcrumbs ? (
            <Breadcrumbs items={breadcrumbs} />
          ) : (
            <>
              <p className="truncate text-sm font-medium text-slate-900">
                {title}
              </p>
              <p className="hidden truncate text-xs text-slate-500 sm:block">
                {subtitle}
              </p>
            </>
          )}
        </div>
      </div>
      <UserMenu />
    </header>
  )
}
