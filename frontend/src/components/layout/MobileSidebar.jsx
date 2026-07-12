import { SidebarBrand, SidebarFooter, SidebarNav } from './SidebarParts'

export default function MobileSidebar({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label="Close sidebar overlay"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-900 text-slate-100 shadow-xl">
        <SidebarBrand onClose={onClose} />
        <SidebarNav onNavigate={onClose} />
        <SidebarFooter />
      </aside>
    </div>
  )
}
