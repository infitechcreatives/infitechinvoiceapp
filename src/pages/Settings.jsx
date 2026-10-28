import { useRef, useState } from 'react'
import { uid, useStore } from '../lib/store'
import { todayISO } from '../lib/format'

const BUSINESS_FIELDS = [
  ['name', 'Business Name'],
  ['tagline', 'Tagline'],
  ['address', 'Address', 'textarea'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['website', 'Website'],
  ['gstin', 'GSTIN (optional)'],
]
const BANK_FIELDS = [
  ['accountName', 'Account Holder Name'],
  ['bankName', 'Bank Name'],
  ['accountNumber', 'Account Number'],
  ['ifsc', 'IFSC Code'],
  ['upiId', 'UPI ID'],
]

export default function Settings() {
  const { settings } = useStore()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      {/* Remount when settings change elsewhere (e.g. after an import) */}
      <BusinessSettings key={JSON.stringify(settings)} />
      <Services />
      <Clients />
      <Backup />
    </div>
  )
}

function BusinessSettings() {
  const { settings, saveSettings } = useStore()
  const [form, setForm] = useState(settings)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const dirty = JSON.stringify(form) !== JSON.stringify(settings)

  const field = ([key, label, type]) => (
    <div key={key} className={type === 'textarea' ? 'sm:col-span-2' : ''}>
      <label className="label">{label}</label>
      {type === 'textarea' ? (
        <textarea rows={2} className="input" value={form[key]} onChange={(e) => set(key, e.target.value)} />
      ) : (
        <input className="input" value={form[key]} onChange={(e) => set(key, e.target.value)} />
      )}
    </div>
  )

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        saveSettings(form)
      }}
    >
      <div>
        <h2 className="mb-3 font-semibold">Business Details</h2>
        <div className="grid gap-3 sm:grid-cols-2">{BUSINESS_FIELDS.map(field)}</div>
      </div>
      <div>
        <h2 className="font-semibold">Bank & UPI</h2>
        <p className="mb-3 text-sm text-slate-500">Optional — only shown on invoices when filled.</p>
        <div className="grid gap-3 sm:grid-cols-2">{BANK_FIELDS.map(field)}</div>
      </div>
      <div>
        <h2 className="mb-3 font-semibold">Invoice Defaults</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Default GST %</label>
            <input type="number" min="0" step="any" className="input" value={form.defaultGstRate} onChange={(e) => set('defaultGstRate', e.target.value)} />
          </div>
          <div>
            <label className="label">Due in (days)</label>
            <input type="number" min="0" className="input" value={form.defaultDueDays} onChange={(e) => set('defaultDueDays', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Default Notes / Terms</label>
            <textarea rows={2} className="input" value={form.defaultNotes} onChange={(e) => set('defaultNotes', e.target.value)} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={!dirty}>
          Save Settings
        </button>
        <span className={`text-sm ${dirty ? 'text-amber-600' : 'text-green-600'}`}>{dirty ? 'Unsaved changes' : 'All changes saved ✓'}</span>
      </div>
    </form>
  )
}

function Services() {
  const { services, saveService, deleteService } = useStore()
  const [name, setName] = useState('')
  const [rate, setRate] = useState('')

  const add = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    saveService({ id: uid(), name: name.trim(), rate: Number(rate) || 0 })
    setName('')
    setRate('')
  }

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-semibold">Saved Services</h2>
        <p className="text-sm text-slate-500">Shown as quick-add buttons when creating an invoice.</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {services.map((s) => (
          <li key={s.id} className="flex items-center gap-2 py-2">
            <input
              className="input flex-1"
              value={s.name}
              onChange={(e) => saveService({ ...s, name: e.target.value })}
              aria-label="Service name"
            />
            <input
              type="number"
              inputMode="decimal"
              min="0"
              className="input w-28"
              value={s.rate}
              onChange={(e) => saveService({ ...s, rate: e.target.value === '' ? '' : Number(e.target.value) })}
              aria-label="Default price"
            />
            <button onClick={() => deleteService(s.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete service">
              ✕
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex gap-2">
        <input className="input flex-1" placeholder="New service" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" inputMode="decimal" min="0" className="input w-28" placeholder="₹ Price" value={rate} onChange={(e) => setRate(e.target.value)} />
        <button className="btn-primary">Add</button>
      </form>
    </section>
  )
}

function Clients() {
  const { clients, deleteClient } = useStore()
  if (clients.length === 0) return null
  return (
    <section className="card space-y-2">
      <div>
        <h2 className="font-semibold">Saved Clients</h2>
        <p className="text-sm text-slate-500">Saved automatically from your invoices.</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {[...clients]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-sm text-slate-500">{[c.phone, c.email].filter(Boolean).join(' · ')}</p>
              </div>
              <button
                onClick={() => confirm(`Remove ${c.name} from saved clients?`) && deleteClient(c.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete client"
              >
                ✕
              </button>
            </li>
          ))}
      </ul>
    </section>
  )
}

function Backup() {
  const store = useStore()
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')

  const exportJson = () => {
    const data = { app: 'infitech-invoice', version: 1, exportedAt: new Date().toISOString(), ...store.exportData() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `infitech-invoices-backup-${todayISO()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const importJson = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const json = JSON.parse(await file.text())
      if (!Array.isArray(json.invoices) || !json.settings) throw new Error('Not a valid backup file')
      const total = json.invoices.length
      if (!confirm(`Import ${total} invoice(s)? This will REPLACE all current data.`)) return
      store.importData(json)
      setMsg(`Imported ${total} invoice(s) and ${json.clients?.length || 0} client(s).`)
    } catch (err) {
      setMsg('Import failed: ' + err.message)
    }
  }

  const billed = store.invoices.length

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-semibold">Backup</h2>
        <p className="text-sm text-slate-500">
          Data is saved only in this browser. Export a backup regularly ({billed} invoice{billed === 1 ? '' : 's'} stored).
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={exportJson}>
          Export JSON
        </button>
        <button className="btn-secondary" onClick={() => fileRef.current.click()}>
          Import JSON
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
      </div>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </section>
  )
}

