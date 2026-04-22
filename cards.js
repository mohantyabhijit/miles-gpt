export const CARD_RULES = {
  "DBS Woman's World": {
    baseMpd: 0.4,
    categories: { online_shopping: 4.0, subscriptions: 4.0 },
    monthlyCap: 1500,
  },
  "HSBC Revolution": {
    baseMpd: 0.4,
    categories: { dining: 4.0, online_shopping: 4.0, entertainment: 4.0 },
    monthlyCap: 1000,
  },
  "UOB Preferred Platinum Visa": {
    baseMpd: 0.4,
    categories: { mobile_wallet: 4.0, contactless: 4.0, dining: 4.0 },
    monthlyCap: 1000,
  },
  "OCBC 90N": {
    baseMpd: 1.2,
    categories: { travel: 2.1, flights: 2.1, hotels: 2.1, foreign_currency: 2.1 },
    monthlyCap: Infinity,
  },
  "Citi PremierMiles": {
    baseMpd: 1.2,
    categories: { travel: 2.2, flights: 2.2, hotels: 2.2, foreign_currency: 2.0 },
    monthlyCap: Infinity,
  },
  "Generic Cashback": {
    baseMpd: 0.6,
    categories: {},
    monthlyCap: Infinity,
  },
};

export function estimateMiles(txn, cardName) {
  const rule = CARD_RULES[cardName] || CARD_RULES["Generic Cashback"];
  const mpd = rule.categories[txn.category] || rule.baseMpd;
  return Math.max(0, txn.amount) * mpd;
}

export function bestCardForTransaction(txn) {
  let best = { card: "Generic Cashback", miles: 0 };
  for (const card of Object.keys(CARD_RULES)) {
    const miles = estimateMiles(txn, card);
    if (miles > best.miles) best = { card, miles };
  }
  return best;
}
