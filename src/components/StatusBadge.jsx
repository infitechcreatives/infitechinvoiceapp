const STYLES = {
  Paid: 'bg-green-100 text-green-700',
  'Partially Paid': 'bg-amber-100 text-amber-700',
  Unpaid: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] || ''}`}>
      {status}
    </span>
  )
}
