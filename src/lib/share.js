import { formatDate, formatINR } from './format'

export function pdfFileName(inv) {
  const client = (inv.client?.name || 'Client').trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
  return `${inv.number}_${client || 'Client'}.pdf`
}

export async function downloadInvoicePdf(element, inv) {
  const { default: html2pdf } = await import('html2pdf.js')
  await html2pdf()
    .set({
      margin: 0,
      filename: pdfFileName(inv),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    })
    .from(element)
    .save()
}

// WhatsApp wants the number in international format without "+" or spaces.
export function whatsappNumber(phone) {
  let digits = (phone || '').replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '')
  if (digits.length === 10) digits = '91' + digits
  return digits
}

export function whatsappLink(inv, totals, settings) {
  const lines = [
    `Hello ${inv.client?.name || ''},`.replace(' ,', ','),
    '',
    `Please find attached invoice *${inv.number}* from ${settings.name}.`,
    '',
    `Amount: *${formatINR(totals.total)}*`,
  ]
  if (totals.received > 0 && totals.balance > 0) lines.push(`Balance due: *${formatINR(totals.balance)}*`)
  if (inv.dueDate && totals.balance > 0) lines.push(`Due date: ${formatDate(inv.dueDate)}`)
  if (settings.upiId && totals.balance > 0) lines.push(`UPI: ${settings.upiId}`)
  lines.push('', 'Thank you for your business!', settings.name)
  const text = encodeURIComponent(lines.join('\n'))
  const number = whatsappNumber(inv.client?.phone)
  return `https://wa.me/${number}?text=${text}`
}
