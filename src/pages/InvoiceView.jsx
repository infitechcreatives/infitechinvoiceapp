import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { calcTotals } from '../lib/calc'
import { formatINR } from '../lib/format'
import { downloadInvoicePdf, whatsappLink } from '../lib/share'
import InvoicePreview from '../components/InvoicePreview'
import ScaledPage from '../components/ScaledPage'
import StatusBadge from '../components/StatusBadge'

export default function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { invoices, settings, saveInvoice, deleteInvoice } = useStore()
  const pageRef = useRef(null)
  const [busy, setBusy] = useState('')
  const inv = invoices.find((i) => i.id === id)

  if (!inv) {
    return (
      <div className="card py-12 text-center">
        <p className="mb-4 text-slate-500">Invoice not found.</p>
        <Link to="/" className="btn-primary">
          Back to invoices
        </Link>
      </div>
    )
  }

  const t = calcTotals(inv)

  const download = async () => {
    setBusy('pdf')
    try {
      await downloadInvoicePdf(pageRef.current, inv)
    } catch (e) {
      alert('Could not create PDF: ' + e.message)
    } finally {
      setBusy('')
    }
  }

  const shareWhatsApp = async () => {
    setBusy('wa')
    try {
      await downloadInvoicePdf(pageRef.current, inv)
    } catch {
      // Still open WhatsApp even if the PDF failed.
    } finally {
      setBusy('')
    }
    const url = whatsappLink(inv, t, settings)
    const win = window.open(url, '_blank')
    if (!win) window.location.href = url
  }

  const markPaid = () => saveInvoice({ ...inv, status: 'Paid', amountReceived: t.total, updatedAt: new Date().toISOString() })

  const remove = () => {
    if (confirm(`Delete ${inv.number}? This cannot be undone.`)) {
      deleteInvoice(inv.id)
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{inv.number}</h1>
          <p className="text-sm text-slate-500">
            {inv.client?.name} · {formatINR(t.total)}
          </p>
        </div>
        <StatusBadge status={inv.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button className="btn-primary py-3" onClick={download} disabled={!!busy}>
          {busy === 'pdf' ? 'Preparing…' : 'Download PDF'}
        </button>
        <button className="btn-whatsapp py-3" onClick={shareWhatsApp} disabled={!!busy}>
          {busy === 'wa' ? 'Preparing…' : 'Share on WhatsApp'}
        </button>
        <Link to={`/edit/${inv.id}`} className="btn-secondary">
          Edit
        </Link>
        <Link to={`/duplicate/${inv.id}`} className="btn-secondary">
          Duplicate
        </Link>
        {inv.status !== 'Paid' && (
          <button className="btn-secondary" onClick={markPaid}>
            Mark as Paid
          </button>
        )}
        <button className="btn-danger" onClick={remove}>
          Delete
        </button>
      </div>
      {!inv.client?.phone && (
        <p className="text-xs text-slate-500">Tip: add the client's phone number to open their WhatsApp chat directly.</p>
      )}

      <ScaledPage>
        <InvoicePreview ref={pageRef} invoice={inv} settings={settings} />
      </ScaledPage>
    </div>
  )
}
