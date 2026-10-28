import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { nextInvoiceNumber, uid, useStore } from '../lib/store'
import { calcTotals, lineAmount } from '../lib/calc'
import { addDaysISO, amountInWords, formatINR, todayISO } from '../lib/format'

const STATUSES = ['Unpaid', 'Partially Paid', 'Paid']
const emptyItem = () => ({ id: uid(), description: '', qty: 1, rate: '' })

function newInvoice(invoices, settings) {
  const date = todayISO()
  return {
    id: uid(),
    number: nextInvoiceNumber(invoices),
    date,
    dueDate: addDaysISO(date, Number(settings.defaultDueDays) || 0),
    client: { name: '', phone: '', email: '', address: '', gstin: '' },
    items: [emptyItem()],
    discountType: 'flat',
    discountValue: '',
    gstEnabled: true,
    gstRate: settings.defaultGstRate ?? 18,
    notes: settings.defaultNotes || '',
    status: 'Unpaid',
    amountReceived: '',
  }
}

export default function InvoiceForm({ duplicate = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { invoices, clients, services, settings, saveInvoice } = useStore()

  const [inv, setInv] = useState(() => {
    const existing = id && invoices.find((i) => i.id === id)
    if (!existing) return newInvoice(invoices, settings)
    if (!duplicate) return structuredClone(existing)
    const fresh = newInvoice(invoices, settings)
    return {
      ...structuredClone(existing),
      id: fresh.id,
      number: fresh.number,
      date: fresh.date,
      dueDate: fresh.dueDate,
      status: 'Unpaid',
      amountReceived: '',
      items: existing.items.map((it) => ({ ...it, id: uid() })),
    }
  })
  const [error, setError] = useState('')
  const isEdit = id && !duplicate && invoices.some((i) => i.id === id)

  const t = calcTotals(inv)
  const set = (patch) => setInv((v) => ({ ...v, ...patch }))
  const setClient = (patch) => setInv((v) => ({ ...v, client: { ...v.client, ...patch } }))
  const setItem = (itemId, patch) =>
    setInv((v) => ({ ...v, items: v.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }))
  const removeItem = (itemId) =>
    setInv((v) => ({ ...v, items: v.items.length > 1 ? v.items.filter((it) => it.id !== itemId) : [emptyItem()] }))
  const addService = (svc) =>
    setInv((v) => {
      const item = { id: uid(), description: svc.name, qty: 1, rate: svc.rate }
      const blank = v.items.findIndex((it) => !it.description && !it.rate)
      const items = [...v.items]
      if (blank !== -1) items[blank] = item
      else items.push(item)
      return { ...v, items }
    })

  const submit = (e) => {
    e.preventDefault()
    if (!inv.client.name.trim()) return setError('Please enter the client name.')
    if (!inv.number.trim()) return setError('Please enter an invoice number.')
    if (invoices.some((i) => i.number === inv.number.trim() && i.id !== inv.id))
      return setError(`Invoice number ${inv.number} is already used.`)
    const items = inv.items.filter((it) => it.description.trim() || Number(it.rate))
    if (items.length === 0) return setError('Add at least one line item.')
    const now = new Date().toISOString()
    saveInvoice({
      ...inv,
      number: inv.number.trim(),
      client: { ...inv.client, name: inv.client.name.trim() },
      items,
      amountReceived: inv.status === 'Paid' ? t.total : inv.status === 'Unpaid' ? 0 : Number(inv.amountReceived) || 0,
      createdAt: inv.createdAt || now,
      updatedAt: now,
    })
    navigate(`/invoice/${inv.id}`, { replace: true })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-bold">{isEdit ? `Edit ${inv.number}` : 'New Invoice'}</h1>

      <section className="card grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Invoice No.</label>
          <input className="input" value={inv.number} onChange={(e) => set({ number: e.target.value })} />
        </div>
        <div>
          <label className="label">Invoice Date</label>
          <input type="date" className="input" value={inv.date} onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" value={inv.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Client</h2>
        <ClientNameInput
          value={inv.client.name}
          clients={clients}
          onChange={(name) => setClient({ name })}
          onPick={(c) => setClient({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', gstin: c.gstin || '' })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Phone (WhatsApp)</label>
            <input type="tel" className="input" value={inv.client.phone} onChange={(e) => setClient({ phone: e.target.value })} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={inv.client.email} onChange={(e) => setClient({ email: e.target.value })} />
          </div>
          <div>
            <label className="label">Address (optional)</label>
            <textarea rows={2} className="input" value={inv.client.address} onChange={(e) => setClient({ address: e.target.value })} />
          </div>
          <div>
            <label className="label">GSTIN (optional)</label>
            <input className="input uppercase" value={inv.client.gstin} onChange={(e) => setClient({ gstin: e.target.value.toUpperCase() })} />
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Items</h2>
        {services.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {services.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => addService(s)}
                  className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  + {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {inv.items.map((it, i) => (
            <div key={it.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <span className="mt-2 w-5 text-sm text-slate-400">{i + 1}.</span>
                <textarea
                  rows={1}
                  className="input flex-1 resize-y"
                  placeholder="Description"
                  value={it.description}
                  onChange={(e) => setItem(it.id, { description: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  className="mt-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_1.4fr_1.4fr] gap-2 pl-7">
                <div>
                  <label className="label text-xs">Qty</label>
                  <input type="number" inputMode="decimal" min="0" step="any" className="input" value={it.qty} onChange={(e) => setItem(it.id, { qty: e.target.value })} />
                </div>
                <div>
                  <label className="label text-xs">Rate (₹)</label>
                  <input type="number" inputMode="decimal" min="0" step="any" className="input" value={it.rate} onChange={(e) => setItem(it.id, { rate: e.target.value })} />
                </div>
                <div>
                  <label className="label text-xs">Amount</label>
                  <p className="py-2 text-right font-semibold">{formatINR(lineAmount(it))}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn-secondary w-full" onClick={() => set({ items: [...inv.items, emptyItem()] })}>
          + Add item
        </button>
      </section>

      <section className="card space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Discount</label>
            <div className="flex">
              <select
                className="input w-16 rounded-r-none border-r-0 px-2"
                value={inv.discountType}
                onChange={(e) => set({ discountType: e.target.value })}
              >
                <option value="flat">₹</option>
                <option value="percent">%</option>
              </select>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className="input rounded-l-none"
                placeholder="0"
                value={inv.discountValue}
                onChange={(e) => set({ discountValue: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={inv.gstEnabled} onChange={(e) => set({ gstEnabled: e.target.checked })} />
              GST (%)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              className="input"
              disabled={!inv.gstEnabled}
              value={inv.gstRate}
              onChange={(e) => set({ gstRate: e.target.value })}
            />
          </div>
        </div>

        <dl className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
          <Row label="Subtotal" value={formatINR(t.subtotal)} />
          {t.discount > 0 && <Row label="Discount" value={'− ' + formatINR(t.discount)} />}
          {inv.gstEnabled && <Row label={`GST (${Number(inv.gstRate) || 0}%)`} value={formatINR(t.tax)} />}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-brand-700">{formatINR(t.total)}</dd>
          </div>
          <p className="text-xs italic text-slate-500">{amountInWords(t.total)}</p>
        </dl>
      </section>

      <section className="card space-y-3">
        <div>
          <label className="label">Status</label>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
            {STATUSES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => set({ status: s })}
                className={`rounded-md px-2 py-2 text-xs font-semibold sm:text-sm ${inv.status === s ? 'bg-white text-brand-700 shadow' : 'text-slate-500'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {inv.status === 'Partially Paid' && (
          <div>
            <label className="label">Amount Received (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              className="input"
              value={inv.amountReceived}
              onChange={(e) => set({ amountReceived: e.target.value })}
            />
            <p className="mt-1 text-sm text-slate-500">Balance due: {formatINR(t.balance)}</p>
          </div>
        )}
        <div>
          <label className="label">Notes / Payment Terms</label>
          <textarea rows={3} className="input" value={inv.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="sticky bottom-16 z-10 flex gap-2 sm:bottom-4">
        <button type="button" className="btn-secondary flex-1 py-3" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-[2] py-3">
          Save & Preview
        </button>
      </div>
    </form>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function ClientNameInput({ value, clients, onChange, onPick }) {
  const [open, setOpen] = useState(false)
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    return clients
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .filter((c) => c.name.toLowerCase() !== q)
      .slice(0, 6)
  }, [value, clients])

  return (
    <div className="relative">
      <label className="label">Client Name *</label>
      <input
        className="input"
        value={value}
        autoComplete="off"
        placeholder={clients.length ? 'Type to search saved clients' : 'Client or company name'}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-brand-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(c)
                  setOpen(false)
                }}
              >
                <span className="font-medium">{c.name}</span>
                {c.phone && <span className="ml-2 text-sm text-slate-500">{c.phone}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
