const planConfig = [
  {
    id: null,
    price: null,
    name: 'Free',
    desc: `I don't want to pay.`,
    feature: [
      { id: 1, quota: 10 },
      { id: 2, quota: 2 },
      { id: 3, quota: 5 },
    ],
  },
  {
    id: undefined,
    name: 'Plus',
    price: null,
    desc: 'I chat sometimes.',
    feature: [
      { id: 1, quota: 50 },
      { id: 2, quota: 5 },
      { id: 3, quota: 20 },
    ],
  },
  {
    id: undefined,
    name: 'Pro',
    price: null,
    desc: 'I chat daily.',
    feature: [
      { id: 1, quota: 100 },
      { id: 2, quota: 10 },
      { id: 3, quota: 50 },
    ],
  },
  {
    id: undefined,
    name: 'Premium',
    price: null,
    desc: 'I always chat.',
    feature: [
      { id: 1, quota: 300 },
      { id: 2, quota: 30 },
      { id: 3, quota: 200 },
    ],
  },
];

const features = () => {
  return [
    { id: 1, desc: 'Chat completion per day' },
    { id: 2, desc: 'Image generation per day' },
    { id: 3, desc: 'Save prompt history to Cloud' },
  ];
};
const plans = ({ prices }) => {
  return planConfig.map((plan) => ({
    ...plan,
    id: prices.find((x) => x.metadata.displayName === plan.name)?.id || null,
    price: prices.find((x) => x.metadata.displayName === plan.name)?.unit_amount || 0,
  }));
};

module.exports = {
  plans,
  planConfig,
  features,
};
