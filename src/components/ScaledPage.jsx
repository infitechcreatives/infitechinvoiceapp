import { useLayoutEffect, useRef, useState } from 'react'

const PAGE_WIDTH = 794 // 210mm at 96dpi

// Shrinks the fixed-width A4 page to fit small screens.
export default function ScaledPage({ children }) {
  const outer = useRef(null)
  const inner = useRef(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const update = () => {
      const s = Math.min(1, outer.current.clientWidth / PAGE_WIDTH)
      setScale(s)
      setHeight(inner.current.offsetHeight * s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(outer.current)
    ro.observe(inner.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height }}>
      <div
        ref={inner}
        className="mx-auto w-fit origin-top-left shadow-lg ring-1 ring-slate-200"
        style={{ transform: `scale(${scale})`, marginLeft: scale < 1 ? 0 : undefined }}
      >
        {children}
      </div>
    </div>
  )
}
