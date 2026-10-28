import { forwardRef } from 'react'
import { calcTotals, lineAmount } from '../lib/calc'
import { amountInWords, formatDate, formatINR } from '../lib/format'

const GRADIENT = 'linear-gradient(90deg, #3B82F6, #1D4ED8)'

// Fixed-size A4 page (210mm wide). Rendered as-is into the PDF.
const InvoicePreview = forwardRef(function InvoicePreview({ invoice: inv, settings: s }, ref) {
  const t = calcTotals(inv)
  const c = inv.client || {}
  const hasBank = s.bankName || s.accountNumber || s.ifsc || s.accountName
  const website = s.website?.replace(/^https?:\/\//, '')

  return (
    <div
      ref={ref}
      className="relative flex flex-col bg-white text-[12.5px] leading-snug text-black"
      style={{ width: '210mm', minHeight: '296mm', fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif' }}
    >
      <div style={{ height: 8, background: GRADIENT }} />

      <div className="flex flex-1 flex-col px-[14mm] pb-[10mm] pt-[10mm]">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-[60%]">
            <img src="/logo-horizontal.png" alt={s.name} style={{ height: 52, width: 'auto' }} />
            {s.tagline && <p className="mt-2 text-[11.5px] italic text-[#1D4ED8]">{s.tagline}</p>}
            <div className="mt-2 space-y-0.5 text-[11.5px] text-[#334155]">
              {s.address && <p>{s.address}</p>}
              <p>{[s.phone, s.email].filter(Boolean).join('  |  ')}</p>
              {website && <p>{website}</p>}
              {s.gstin && (
                <p>
                  <span className="font-semibold text-black">GSTIN:</span> {s.gstin}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h1
              className="text-[30px] font-extrabold tracking-[0.12em]"
              style={{ color: '#1D4ED8' }}
            >
              INVOICE
            </h1>
            <table className="ml-auto mt-2 text-[12px]">
              <tbody>
                <MetaRow label="Invoice No." value={inv.number} bold />
                <MetaRow label="Invoice Date" value={formatDate(inv.date)} />
                {inv.dueDate && <MetaRow label="Due Date" value={formatDate(inv.dueDate)} />}
                <MetaRow label="Status" value={inv.status} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill to */}
        <div className="mt-6 rounded-lg border border-[#DBEAFE] bg-[#F8FAFF] px-4 py-3">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#1D4ED8]">Bill To</p>
          <p className="mt-1 text-[14px] font-bold">{c.name || '—'}</p>
          <div className="mt-0.5 space-y-0.5 text-[11.5px] text-[#334155]">
            {c.address && <p className="whitespace-pre-line">{c.address}</p>}
            {(c.phone || c.email) && <p>{[c.phone, c.email].filter(Boolean).join('  |  ')}</p>}
            {c.gstin && (
              <p>
                <span className="font-semibold text-black">GSTIN:</span> {c.gstin}
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <table className="mt-6 w-full border-collapse text-[12px]">
          <thead>
            <tr style={{ background: GRADIENT }} className="text-white">
              <th className="w-8 rounded-l-md px-2 py-2 text-left font-semibold">#</th>
              <th className="px-2 py-2 text-left font-semibold">Description</th>
              <th className="w-14 px-2 py-2 text-right font-semibold">Qty</th>
              <th className="w-28 px-2 py-2 text-right font-semibold">Rate</th>
              <th className="w-32 rounded-r-md px-2 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={it.id} className="border-b border-[#E2E8F0]" style={{ pageBreakInside: 'avoid' }}>
                <td className="px-2 py-2 align-top text-[#64748B]">{i + 1}</td>
                <td className="whitespace-pre-line px-2 py-2 align-top">{it.description || '—'}</td>
                <td className="px-2 py-2 text-right align-top">{it.qty}</td>
                <td className="px-2 py-2 text-right align-top">{formatINR(it.rate)}</td>
                <td className="px-2 py-2 text-right align-top font-medium">{formatINR(lineAmount(it))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + payment details */}
        <div className="mt-5 flex items-start justify-between gap-8" style={{ pageBreakInside: 'avoid' }}>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#1D4ED8]">Amount in words</p>
              <p className="mt-1 font-medium">{amountInWords(t.total)}</p>
            </div>
            {(hasBank || s.upiId) && (
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#1D4ED8]">Payment Details</p>
                <table className="mt-1 text-[11.5px]">
                  <tbody>
                    {s.accountName && <DetailRow label="A/c Name" value={s.accountName} />}
                    {s.bankName && <DetailRow label="Bank" value={s.bankName} />}
                    {s.accountNumber && <DetailRow label="A/c No." value={s.accountNumber} />}
                    {s.ifsc && <DetailRow label="IFSC" value={s.ifsc} />}
                    {s.upiId && <DetailRow label="UPI ID" value={s.upiId} />}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <table className="w-[78mm] text-[12px]">
            <tbody>
              <TotalRow label="Subtotal" value={formatINR(t.subtotal)} />
              {t.discount > 0 && (
                <TotalRow
                  label={`Discount${inv.discountType === 'percent' ? ` (${Number(inv.discountValue)}%)` : ''}`}
                  value={'− ' + formatINR(t.discount)}
                />
              )}
              {inv.gstEnabled && <TotalRow label={`GST (${Number(inv.gstRate)}%)`} value={formatINR(t.tax)} />}
              <tr style={{ background: GRADIENT }} className="text-white">
                <td className="rounded-l-md px-3 py-2 text-[13px] font-bold">Total</td>
                <td className="rounded-r-md px-3 py-2 text-right text-[14px] font-bold">{formatINR(t.total)}</td>
              </tr>
              {inv.status !== 'Unpaid' && <TotalRow label="Amount Received" value={formatINR(t.received)} />}
              {inv.status !== 'Paid' && (
                <tr>
                  <td className="px-3 pt-2 font-bold">Balance Due</td>
                  <td className="px-3 pt-2 text-right font-bold text-[#B91C1C]">{formatINR(t.balance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {inv.notes && (
          <div className="mt-6" style={{ pageBreakInside: 'avoid' }}>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#1D4ED8]">Notes / Terms</p>
            <p className="mt-1 whitespace-pre-line text-[11.5px] text-[#334155]">{inv.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-10 text-center" style={{ pageBreakInside: 'avoid' }}>
          <p className="text-[15px] font-bold text-[#1D4ED8]">Thank you for your business!</p>
          <p className="mt-1 text-[10.5px] text-[#64748B]">
            {[s.name, s.phone, s.email, website].filter(Boolean).join('  •  ')}
          </p>
        </div>
      </div>

      <div style={{ height: 8, background: GRADIENT }} />

      {inv.status === 'Paid' && (
        <div
          className="pointer-events-none absolute select-none rounded-lg border-[5px] border-[#16A34A] px-6 py-1 text-[56px] font-black tracking-[0.15em] text-[#16A34A]"
          style={{ top: '60mm', right: '24mm', transform: 'rotate(-14deg)', opacity: 0.35 }}
        >
          PAID
        </div>
      )}
    </div>
  )
})

function MetaRow({ label, value, bold }) {
  return (
    <tr>
      <td className="py-0.5 pr-3 text-left text-[#64748B]">{label}</td>
      <td className={`py-0.5 text-right ${bold ? 'font-bold' : 'font-medium'}`}>{value}</td>
    </tr>
  )
}

function DetailRow({ label, value }) {
  return (
    <tr>
      <td className="py-0.5 pr-3 text-[#64748B]">{label}</td>
      <td className="py-0.5 font-medium">{value}</td>
    </tr>
  )
}

function TotalRow({ label, value }) {
  return (
    <tr>
      <td className="px-3 py-1.5 text-[#475569]">{label}</td>
      <td className="px-3 py-1.5 text-right font-medium">{value}</td>
    </tr>
  )
}

export default InvoicePreview
