import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'infitech-invoice-data-v1'

export const DEFAULT_SETTINGS = {
  name: 'InfiTech Creatives',
  tagline: 'Your All-in-One Tech & Design Partner',
  address: 'Muzaffarnagar, Uttar Pradesh 251001, India',
  phone: '+91 7900924286',
  email: 'info@infitechcreatives.in',
  website: 'www.infitechcreatives.in',
  gstin: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
  ifsc: '',
  upiId: '',
  defaultGstRate: 18,
  defaultDueDays: 7,
  defaultNotes: 'Payment due within 7 days of invoice date.',
}

const DEFAULT_SERVICES = [
  { name: 'Video Shoot', rate: 5000 },
  { name: 'Video Editing (per Reel)', rate: 1000 },
  { name: 'Meta Ads Management', rate: 8000 },
  { name: 'Website Development', rate: 25000 },
  { name: 'Animated Wedding Invitation', rate: 3000 },
].map((s) => ({ ...s, id: uid() }))

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function emptyData() {
  return { settings: DEFAULT_SETTINGS, clients: [], services: DEFAULT_SERVICES, invoices: [] }
}

function normalize(data) {
  const base = emptyData()
  return {
    settings: { ...DEFAULT_SETTINGS, ...(data?.settings || {}) },
    clients: Array.isArray(data?.clients) ? data.clients : base.clients,
    services: Array.isArray(data?.services) ? data.services : base.services,
    invoices: Array.isArray(data?.invoices) ? data.invoices : base.invoices,
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? normalize(JSON.parse(raw)) : emptyData()
  } catch {
    return emptyData()
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [data, setData] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const api = {
    ...data,
    saveSettings: (settings) => setData((d) => ({ ...d, settings })),

    saveInvoice: (inv) =>
      setData((d) => {
        const exists = d.invoices.some((i) => i.id === inv.id)
        const invoices = exists
          ? d.invoices.map((i) => (i.id === inv.id ? inv : i))
          : [...d.invoices, inv]
        return { ...d, invoices, clients: upsertClient(d.clients, inv.client) }
      }),
    deleteInvoice: (id) => setData((d) => ({ ...d, invoices: d.invoices.filter((i) => i.id !== id) })),

    saveService: (svc) =>
      setData((d) => ({
        ...d,
        services: d.services.some((s) => s.id === svc.id)
          ? d.services.map((s) => (s.id === svc.id ? svc : s))
          : [...d.services, svc],
      })),
    deleteService: (id) => setData((d) => ({ ...d, services: d.services.filter((s) => s.id !== id) })),

    deleteClient: (id) => setData((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) })),

    exportData: () => data,
    importData: (json) => setData(normalize(json)),
  }

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}

// Remember the client (matched by name, case-insensitive) with their latest details.
function upsertClient(clients, client) {
  const name = client?.name?.trim()
  if (!name) return clients
  const { name: _n, ...details } = client
  const idx = clients.findIndex((c) => c.name.toLowerCase() === name.toLowerCase())
  if (idx === -1) return [...clients, { id: uid(), name, ...details }]
  return clients.map((c, i) => (i === idx ? { ...c, ...details, name } : c))
}

// Next number like INV-2026-003, based on the highest number used this year.
export function nextInvoiceNumber(invoices, year = new Date().getFullYear()) {
  const prefix = `INV-${year}-`
  const max = invoices.reduce((m, inv) => {
    if (!inv.number?.startsWith(prefix)) return m
    const n = parseInt(inv.number.slice(prefix.length), 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return prefix + String(max + 1).padStart(3, '0')
}
