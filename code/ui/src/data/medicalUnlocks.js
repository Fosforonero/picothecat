export function unlockForKcal(kcal) {
  const n = Number(kcal)
  if (!Number.isFinite(n)) return 'Acqua e buona volontà'
  if (n < 150) return 'Acqua e buona volontà'
  if (n < 300) return 'Caffè (amaro, lo meriti appena)'
  if (n < 450) return 'Cornetto e cappuccino'
  if (n < 600) return 'Brioche con la crema'
  if (n < 800) return 'Carbonara'
  if (n < 1100) return 'Pizza Margherita'
  if (n < 1400) return 'Bistecca alla fiorentina'
  return 'Lasagna intera + tiramisù'
}

