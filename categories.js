const RULES = [
  { category: "dining", rx: /(restaurant|cafe|coffee|food|grabfood|deliveroo|mcd|kfc|pizza|sushi)/i },
  { category: "flights", rx: /(air|airline|singapore airlines|scoot|delta|united|emirates)/i },
  { category: "hotels", rx: /(hotel|resort|booking.com|agoda|airbnb)/i },
  { category: "groceries", rx: /(ntuc|fairprice|cold storage|sheng siong|trader joe|walmart|market)/i },
  { category: "online_shopping", rx: /(amazon|shopee|lazada|taobao|etsy|ebay)/i },
  { category: "subscriptions", rx: /(spotify|netflix|youtube|apple.com\/bill|disney\+|prime)/i },
  { category: "transport", rx: /(grab|uber|lyft|taxi|mrt|metro|shell|esso|caltex)/i },
  { category: "entertainment", rx: /(cinema|movie|steam|playstation|xbox|concert)/i },
  { category: "utilities", rx: /(utility|electric|water|telco|starhub|singtel|m1)/i },
];

export function normalizeMerchant(raw) {
  const clean = raw.trim().replace(/\s+/g, " ");
  if (/^amzn/i.test(clean)) return "Amazon";
  if (/spotify/i.test(clean)) return "Spotify";
  if (/grab/i.test(clean)) return "Grab";
  return clean;
}

export function classifyTransaction(merchant, currency) {
  const normalized = normalizeMerchant(merchant);
  const hit = RULES.find((r) => r.rx.test(normalized));
  const category = hit?.category || "offline_retail";
  const foreign = currency && currency.toUpperCase() !== "SGD";
  const spendType = {
    online: ["online_shopping", "subscriptions"].includes(category),
    recurring: category === "subscriptions",
    foreign_currency: foreign,
    contactless: ["dining", "transport"].includes(category),
  };
  return { normalized, category: foreign ? "foreign_currency" : category, spendType };
}
