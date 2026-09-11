import { getMe } from './account.js';

const plans = [
  { id: 'm1', months: 1, price: 99, label: '1 month' },
  { id: 'm2', months: 2, price: 149, label: '2 months', tag: 'Starter save' },
  { id: 'm3', months: 3, price: 199, label: '3 months', tag: 'Popular' },
  { id: 'm6', months: 6, price: 399, label: '6 months', tag: 'Best for prep' },
  { id: 'y1', months: 12, price: 599, label: '1 year', tag: 'Best value' }
];

const planBox = document.querySelector('#plans');
const status = document.querySelector('#paymentStatus');

planBox.innerHTML = plans.map((plan) => `
  <article class="plan ${plan.id === 'y1' ? 'featured' : ''}">
    ${plan.tag ? `<span class="plan-tag">${plan.tag}</span>` : ''}
    <h2>${plan.label}</h2>
    <div class="price"><small>₹</small>${plan.price}</div>
    <p>${plan.months === 1 ? 'Flexible monthly access' : `₹${Math.round(plan.price / plan.months)} average / month`}</p>
    <button class="btn ${plan.id === 'y1' ? 'dark' : 'primary'}" data-plan="${plan.id}">Choose ${plan.label}</button>
  </article>`).join('');

planBox.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-plan]');
  if (!button) return;
  button.disabled = true;
  status.textContent = 'Preparing secure checkout…';

  try {
    const user = await getMe();
    if (!user) {
      location.href = 'auth.html?next=pricing.html';
      return;
    }

    const response = await fetch('/api/payments/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ planId: button.dataset.plan })
    });
    const order = await response.json();
    if (!response.ok) throw new Error(order.message || 'Could not start payment');
    if (!window.Razorpay) throw new Error('Payment checkout could not load. Check your connection.');

    new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: 'INR',
      name: 'DSA Visual Lab',
      description: order.planLabel,
      order_id: order.orderId,
      prefill: { name: user.name, email: user.email },
      theme: { color: '#2783DE' },
      handler: async (payment) => {
        status.textContent = 'Verifying payment…';
        const verifyResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...payment, planId: button.dataset.plan })
        });
        const result = await verifyResponse.json();
        if (!verifyResponse.ok) {
          status.textContent = result.message || 'Verification failed';
          return;
        }
        status.textContent = 'Premium activated! Your learning journey is unlocked.';
      }
    }).open();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

getMe().then((user) => {
  const accountLink = document.querySelector('#accountLink');
  if (user) accountLink.textContent = user.isPremium ? 'Premium ✓' : user.name;
});
