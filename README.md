# DSA Visual Lab Premium

Production-oriented Node.js + Express + MongoDB learning platform with a vanilla JavaScript frontend.

## Included
- Existing interactive visual labs and unlock progression
- 40 DSA topics with 80 explanation-first questions
- Search and category filters
- Email/password login with bcrypt password hashing
- HTTP-only JWT session cookies
- MongoDB user, progress, subscription, and payment-order models
- Razorpay order creation and server-side HMAC signature verification
- Premium plans: ₹99/1 month, ₹149/2 months, ₹199/3 months, ₹399/6 months, ₹599/1 year
- Responsive pricing, login, and question-bank pages
- Helmet headers, payload limits, rate limiting, and environment variables

## Local setup
1. Install Node.js 18+ and MongoDB, or create a MongoDB Atlas database.
2. Copy `.env.example` to `.env` and replace every value.
3. Install and start:
```bash
npm install
npm start
```
4. Open `http://localhost:8000`.

## Razorpay setup
Create a Razorpay merchant account, complete KYC, and put test keys in `.env`. Test the full flow before switching to live keys. The browser never receives the secret key. Payment access is activated only after the backend verifies Razorpay's signature.

## Production checklist
- Generate a long random `JWT_SECRET`; never commit `.env`.
- Use MongoDB Atlas network restrictions and a least-privilege database user.
- Deploy behind HTTPS so secure cookies are enforced.
- Configure your domain, Razorpay live keys, Terms, Privacy, Refund/Cancellation, Contact, and Pricing pages.
- Add transactional email, password reset, email verification, admin reporting, backups, monitoring, and payment webhooks before a public launch.
- Confirm GST/invoicing and consumer-law requirements with a qualified professional.
- Run `npm audit`, dependency updates, and an external security review before accepting real payments.

## Deploy
Works on Render, Railway, Fly.io, a Node VPS, or any Docker host. Add the environment variables in the host dashboard and use `npm start`. Static frontend files are served from `public/`.
