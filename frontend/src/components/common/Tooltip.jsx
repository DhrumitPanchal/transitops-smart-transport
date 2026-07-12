import { useId, useState } from 'react'
import { cn } from '../../utils/helpers'

export default function Tooltip({ content, children, className }) {
  const [visible, setVisible] = useState(false)
  const tooltipId = useId()

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? tooltipId : undefined}>{children}</span>
      {visible ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white"
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}
