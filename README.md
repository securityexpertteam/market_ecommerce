# Hype Marketplace

Expo React Native storefront plus Express/MongoDB API. It includes buyer and seller flows, JWT authentication, inventory endpoints, stock-aware dummy checkout, and order emails.

## Start locally

1. Create a free MongoDB Atlas database and allow your development IP under **Network Access**.
2. Copy `server/.env.example` to `server/.env`, then set `MONGODB_URI` and a long random `JWT_SECRET`. SMTP variables are optional; without them the app simply skips email delivery.
3. Run `npm install` from the repository root.
4. Start the API: `npm run dev:server`.
5. In a second terminal start Expo: `npm run dev:mobile`. For an Android emulator, the demo API base URL is already `http://10.0.2.2:4000/api`. Change `API` in `mobile/App.tsx` to your computer's LAN IP for Expo Go on a physical device.

The API creates demo inventory on first startup. Seller demo credentials are `seller@hype.local` / `Seller123!`; change or remove them before any public deployment. Seller registration requires a valid GSTIN.

## API surface

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/products`, `GET /api/products/:id`
- Seller-only: `POST|PATCH|DELETE /api/products/:id`, `GET /api/seller/products`
- Buyer: `POST /api/orders`, `GET /api/orders`

Send the access token using `Authorization: Bearer <token>`. The mobile UI currently has a local demo sign-in state; use the API routes above to wire it to a persistent account provider when moving beyond the demo.

## Deploy safely

### Render deployment

Use the repository's `render.yaml` as a Blueprint. It creates:

- `hype-marketplace-api`: Node/Express API
- `hype-marketplace-web`: Expo web static site

Set these values in Render before the first deploy:

- API `MONGODB_URI`: MongoDB Atlas connection string
- API `JWT_SECRET`: long random production secret
- API `CLIENT_ORIGIN`: deployed web URL, for example `https://hype-marketplace-web.onrender.com`
- API seed seller variables, if demo inventory is needed
- Web `EXPO_PUBLIC_API_URL`: `https://hype-marketplace-api.onrender.com/api`

The web build embeds `EXPO_PUBLIC_API_URL`, so redeploy the static site after changing it. Seller catalog create, edit, delete, promotion settings, and prize images use the authenticated API; no Render filesystem storage is required. Keep large production images in object storage or image URLs because Render free instances are stateless.

MongoDB Atlas M0 and Render free tiers are suitable for a demo only, not the stated 10k concurrent-user target. That requires load testing, a horizontally scalable compute tier, Redis-backed distributed rate limiting/cache, and a paid Atlas cluster with appropriate connection-pool and index design. ok
