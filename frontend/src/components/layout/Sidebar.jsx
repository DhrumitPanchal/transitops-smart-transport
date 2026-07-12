import { cn } from '../../utils/helpers'
import { SidebarBrand, SidebarFooter, SidebarNav } from './SidebarParts'

export default function Sidebar({ className }) {
  return (
    <aside
      className={cn(
        'hidden w-64 shrink-0 flex-col bg-slate-900 text-slate-100 lg:flex',
        className,
      )}
    >
      <SidebarBrand />
      <SidebarNav />
      <SidebarFooter />
    </aside>
  )
}
