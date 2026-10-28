import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { calcTotals } from '../lib/calc'
import { formatDate, formatINR } from '../lib/format'
import StatusBadge from '../components/StatusBadge'

const STATUSES = ['All', 'Unpaid', 'Partially Paid', 'Paid']

export default function Dashboard() {
  const { invoices, deleteInvoice } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')

  const rows = useMemo(
    () =>
      invoices
        .map((inv) => ({ inv, t: calcTotals(inv) }))
        .sort((a, b) => (b.inv.date + b.inv.number).localeCompare(a.inv.date + a.inv.number)),
    [invoices],
  )

  const summary = rows.reduce(
    (s, { t }) => ({ billed: s.billed + t.total, received: s.received + t.received, pending: s.pending + t.balance }),
    { billed: 0, received: 0, pending: 0 },
  )

  const q = query.trim().toLowerCase()
  const filtered = rows.filter(
    ({ inv }) =>
      (status === 'All' || inv.status === status) &&
      (!q || inv.client?.name?.toLowerCase().includes(q) || inv.number.toLowerCase().includes(q)),
  )

  const remove = (inv) => {
    if (confirm(`Delete ${inv.number}? This cannot be undone.`)) deleteInvoice(inv.id)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Stat label="Total Billed" value={summary.billed} className="text-slate-900" />
        <Stat label="Received" value={summary.received} className="text-green-600" />
        <Stat label="Pending" value={summary.pending} className="text-red-600" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="input"
          placeholder="Search by client or invoice no."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <Link to="/new" className="btn-primary hidden whitespace-nowrap sm:inline-flex">
          + New Invoice
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="card py-12 text-center text-slate-500">
          {invoices.length === 0 ? (
            <>
              <p className="mb-4">No invoices yet.</p>
              <Link to="/new" className="btn-primary">
                + Create your first invoice
              </Link>
            </>
          ) : (
            <p>No invoices match your search.</p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(({ inv, t }) => (
            <li key={inv.id} className="card p-0">
              <button
                className="flex w-full items-start justify-between gap-3 p-4 text-left"
                onClick={() => navigate(`/invoice/${inv.id}`)}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{inv.client?.name || 'No client'}</p>
                  <p className="text-sm text-slate-500">
                    {inv.number} · {formatDate(inv.date)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">{formatINR(t.total)}</p>
                  <StatusBadge status={inv.status} />
                </div>
              </button>
              <div className="flex divide-x divide-slate-100 border-t border-slate-100 text-sm">
                <Link to={`/edit/${inv.id}`} className="flex-1 py-2 text-center text-slate-600 hover:bg-slate-50">
                  Edit
                </Link>
                <Link to={`/duplicate/${inv.id}`} className="flex-1 py-2 text-center text-slate-600 hover:bg-slate-50">
                  Duplicate
                </Link>
                <button onClick={() => remove(inv)} className="flex-1 py-2 text-center text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stat({ label, value, className }) {
  return (
    <div className="card p-3 sm:p-4">
      <p className="text-xs text-slate-500 sm:text-sm">{label}</p>
      <p className={`mt-1 break-all text-sm font-bold sm:text-xl ${className}`}>{formatINR(value)}</p>
    </div>
  )
}
