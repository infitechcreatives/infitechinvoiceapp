const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export function lineAmount(item) {
  return round2((Number(item.qty) || 0) * (Number(item.rate) || 0))
}

export function calcTotals(inv) {
  const subtotal = round2(inv.items.reduce((sum, it) => sum + lineAmount(it), 0))
  const dv = Number(inv.discountValue) || 0
  let discount = inv.discountType === 'percent' ? (subtotal * dv) / 100 : dv
  discount = round2(Math.min(Math.max(discount, 0), subtotal))
  const taxable = round2(subtotal - discount)
  const tax = inv.gstEnabled ? round2((taxable * (Number(inv.gstRate) || 0)) / 100) : 0
  const total = round2(taxable + tax)
  const received =
    inv.status === 'Paid' ? total : inv.status === 'Unpaid' ? 0 : round2(Number(inv.amountReceived) || 0)
  const balance = round2(Math.max(total - received, 0))
  return { subtotal, discount, taxable, tax, total, received, balance }
}
