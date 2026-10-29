# Lavina Jewelry Store

Lavina is a bilingual Arabic/English jewelry e-commerce website built with React and Vite on the client and Node.js/Express with SQLite on the server. It includes a customer storefront, account and order history, checkout, an admin dashboard, and a lightweight rule-based shopping assistant called Lavina AI.

> **Before publishing:** configure a private admin account and a strong JWT secret. Never commit `.env`, the SQLite database, customer data, or uploaded customer/store images. The repository `.gitignore` excludes local environment files, the database, uploads, dependencies, and build output.

## Features

### Customer storefront
- Responsive Arabic and English interfaces with RTL/LTR direction switching.
- Product catalog with categories, product details, SKU, price, discounts, stock availability, karat, weight, and product images.
- Search suggestions and related product matching, with support for approximate spelling.
- New-arrival, best-seller, category carousel, and product-type sections.
- Shopping cart and wishlist.
- Customer registration, sign-in, and account details.
- Checkout with delivery governorate, city, street address, phone number, and one of three payment choices: Fawry, InstaPay, or cash on delivery.
- Order history in the customer account, including order status, date, payment method, line items, and total. Orders remain associated with the customer account after sign-out.
- Customer product reviews.
- Store locations, contact details, map links, photos, and opening hours.
- Lavina AI floating chat assistant for common product, payment, delivery, order-status, return, and store-location questions. Product-related answers can include links to matching catalog items.

### Admin dashboard
- Restricted to accounts with the `admin` role.
- Review order details, including customer contact and delivery address, payment choice, line items, prices, and totals.
- Approve or reject pending orders, then update the status of approved orders.
- Add, edit, and hide products; manage inventory, categories, prices, discounts, and images.
- Moderate customer reviews.
- Manage store details, photos, map links, and opening hours.
- Lists initially show 10 entries, with a **More** button to reveal the next 10.
- Uploaded images are stored under `server/uploads` and served from `/uploads`.

## Technology
- **Client:** React 18, React Router, Vite.
- **Server:** Node.js, Express, Zod request validation, JWT authentication, bcryptjs password hashing.
- **Database:** SQLite through `better-sqlite3`.
- **Images:** Local sample product/category images in `client/public/images`; uploaded admin images in `server/uploads`.

## Requirements
- Node.js 20 or newer (use a Node version supported by `better-sqlite3` on your operating system).
- npm.

## Local setup

Run commands from the repository root.

1. Install server dependencies:

   ```sh
   cd server
   npm install
   ```

2. Create the local environment file by copying `server/.env.example` to `server/.env`. For example, from the repository root:

   ```powershell
   Copy-Item server\.env.example server\.env
   ```

   Set unique values for `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. The seed script requires the admin password to be at least 12 characters. Do not use the example values in a public or production environment.

   Example configuration (replace all placeholder values):

   ```dotenv
   PORT=4000
   JWT_SECRET=replace-with-a-long-random-secret
   CLIENT_ORIGIN=http://localhost:5173
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=replace-with-a-unique-password-of-12-characters-or-more
   ```

3. Initialize a new development database and create the configured admin account:

   ```sh
   npm run seed
   ```

   **Warning:** `npm run seed` clears and repopulates the database, including users, products, reviews, stores, and orders. Run it only when creating/resetting a disposable development database. It is not a production migration or backup command.

4. Start the API server:

   ```sh
   npm run dev
   ```

   The API listens on `http://localhost:4000` by default.

5. In a second terminal, install and start the client:

   ```sh
   cd client
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. Vite proxies `/api` and `/uploads` requests to the local API server.

### Build the client

```sh
cd client
npm run build
```

The production client files are generated in `client/dist`. `npm run preview` can serve the build locally for a preview; it is not a production API server.

## Admin access

The admin account is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env` when `npm run seed` is run. Sign in through the account page, then use **Admin** in the header or visit `/admin`.

To change the admin credentials for an existing database, update that user through a secure account-management process or create a suitable admin account in the database; changing `.env` alone does not update an account that has already been seeded.

## API overview

All endpoints are served by the Express API under `/api`. Endpoints that require a signed-in user require a bearer JWT. Admin endpoints additionally require the `admin` role.

| Area | Routes | Access |
|---|---|---|
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /me` | Public for register/login; authenticated for `/me` |
| Catalog | `GET /categories`, `GET /products`, `GET /products/:id`, `GET /products/:id/reviews` | Public |
| Reviews | `POST /products/:id/reviews` | Authenticated |
| Wishlist | `GET /wishlist`, `PUT /wishlist/:productId`, `DELETE /wishlist/:productId` | Authenticated |
| Customer orders | `POST /orders`, `GET /orders` | Authenticated |
| Admin orders | `GET /admin/orders`, `PATCH /admin/orders/:id` | Admin |
| Admin products | `GET /admin/products`, `POST /admin/products`, `PUT /admin/products/:id`, `DELETE /admin/products/:id` | Admin |
| Admin uploads | `POST /admin/uploads` | Admin |
| Admin reviews | `GET /admin/reviews`, `PATCH /admin/reviews/:id`, `DELETE /admin/reviews/:id` | Admin |
| Admin stores | `GET /admin/stores`, `POST /admin/stores`, `PUT /admin/stores/:id`, `DELETE /admin/stores/:id` | Admin |
| Storefront locations | `GET /stores` | Public |

### Checkout and payment note

Fawry, InstaPay, and cash on delivery are currently stored as the selected payment method on an order. The application does **not** integrate with a payment gateway, generate payment references, verify transfers, or process online payments. Pending orders are sent to the admin for approval.

## Database and stored files

The database file is created automatically at `server/lavina.db` when the server starts. The schema is defined in `server/src/schema.sql`; `server/src/db.js` enables SQLite WAL mode and applies a few additive column migrations for existing local databases.

Main tables:

| Table | Purpose |
|---|---|
| `users` | Customer/admin identity, contact details, hashed password, and role |
| `addresses` | Reserved for saved customer addresses; the current checkout does not use this table |
| `categories` | Arabic/English category labels, slugs, images, and display order |
| `products` | Product catalog, SKU, prices, discounts, inventory, attributes, and image URLs |
| `orders` | Customer, delivery-address snapshot, selected payment method, status, totals, and creation time |
| `order_items` | Product/price/quantity snapshots for each order line |
| `reviews` | Customer ratings/comments and admin approval state |
| `wishlist` | Customer-to-product saved items |
| `stores` | Branch contact information, images, map links, and opening hours |

Order statuses are `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, and `returned`. Pending orders start in admin review. Rejecting/cancelling an order restores its ordered quantities to product stock.

Back up the database and `server/uploads` together using a consistent backup process. Do not commit the live database: it can contain personal customer information, order histories, and account data. The included sample catalog images are illustrative; replace them with authorized product/store images before commercial use.

## English technical notes

### Function overview
- `server/src/index.js` defines and starts the REST API, validates request bodies with Zod, verifies JWTs, checks admin permissions, calculates order prices from database records, updates stock transactionally, and exposes public/admin routes.
- `server/src/db.js` opens the SQLite database, enables write-ahead logging, creates the schema, and applies additive compatibility migrations.
- `server/src/seed.js` is a destructive development-data initializer. It requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the server environment and recreates the demo catalog and admin account.
- `client/src/api.js` is the browser-side API helper. It sends JSON requests and includes the bearer token when provided.
- `client/src/store.jsx` provides shared client state for authentication, language, cart, wishlist, and drawers. The server remains the source of truth for order and inventory data.
- `client/src/pages/Checkout.jsx` collects delivery details and payment choice, then submits product IDs and quantities; the server recalculates prices and validates stock.
- `client/src/pages/Admin.jsx` provides the admin interface for order review, catalog management, reviews, and store information.
- `client/src/components/ChatBot.jsx` is a local rule-based assistant. It does not call an external AI service.

### Database notes
- SQLite is the current database; `better-sqlite3` is used synchronously by the API.
- Passwords are stored as bcrypt hashes. Never store or commit plain-text credentials.
- Order rows keep delivery and total snapshots. Order items keep the product name, unit price, and quantity at purchase time so that order history remains useful if catalog data changes.
- Product images are stored as JSON arrays of URLs in the `products.images` column; store images and opening hours are also serialized JSON text.
- `addresses` is present in the schema for user-associated address records. The current checkout does not yet provide an address book; it records the submitted delivery details on each order.
- Schema changes for an existing database should be implemented as safe, additive migrations in `server/src/db.js`. Do not run the seed script to apply production schema changes.

## Deployment checklist
- Use a private repository if the project contains internal business information.
- Configure strong, unique `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` values in the hosting provider's secret/environment settings.
- Set `CLIENT_ORIGIN` to the actual website origin and configure HTTPS.
- Use persistent storage for `server/lavina.db` and `server/uploads`; ephemeral hosting storage will lose orders and uploaded images.
- Back up the database and uploads, and restrict access to backups.
- Do not use `npm run seed` against a live database.
- Replace sample/illustrative images with images that Lavina is authorized to publish.

## Deploy the API to Koyeb and the frontend to Vercel

The repository is a monorepo: deploy the **API only** to Koyeb using the root `Dockerfile`, and deploy the **client only** to Vercel using `client` as its Root Directory. Both services can be connected to the same GitHub repository and deployed independently.

### 1. Push the repository to GitHub

Create a GitHub repository (private is recommended), then add it as the `origin` remote and push the project branch. Do not push `.env`, the SQLite database, database WAL files, or `server/uploads`; they are excluded by `.gitignore`. The admin login is not hard-coded: set it in the Koyeb environment as described below.

### 2. Deploy the API on Koyeb

1. In Koyeb, create a Web Service from the GitHub repository and select the repository branch to deploy.
2. Select **Docker** as the builder. Set the Dockerfile and build context to the repository root (`Dockerfile`).
3. Configure the service to expose the container's HTTP port `8000`.
4. Configure these environment variables in Koyeb:
   - `NODE_ENV=production`
   - `PORT=8000`
   - `JWT_SECRET`: a unique random secret of at least 32 characters
   - `CLIENT_ORIGIN`: the exact Vercel production origin, for example `https://your-store.vercel.app` (comma-separated origins are supported)
   - `API_PUBLIC_URL`: the public Koyeb HTTPS URL for this API, without a trailing slash
   - `DATABASE_PATH=/var/lib/lavina/lavina.db`
   - `UPLOADS_DIR=/var/lib/lavina/uploads`
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: set these if initializing a new database with the seed script; use a unique password of at least 12 characters
5. Attach persistent storage mounted at `/var/lib/lavina`. The SQLite database and uploaded images must survive restarts and redeployments. Run this service as a **single instance** when using SQLite on a mounted volume.
6. Configure the health check path as `/health`. The API returns `{ "status": "ok" }` when it is running.
7. Initialize a new, empty database once with the demo catalog/admin seed only if desired. `npm run seed` deletes existing users, products, reviews, stores, and orders, so never configure it as the service startup command and never run it on a database containing live data. Existing production data should be migrated/imported using a deliberate backup-and-restore process.

The API Docker image intentionally copies only `server`; it does not build or serve the React frontend. Product/category images from `client/public/images` are served by Vercel. Uploaded files are served by Koyeb at `/uploads`.

### 3. Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `client`. Use the Vite defaults, or set Build Command to `npm run build` and Output Directory to `dist`.
3. Add the environment variable `VITE_API_URL` with the public Koyeb API origin, for example `https://your-api.koyeb.app` (no trailing slash). Set it for the production environment and any preview environments you intend to use.
4. Deploy the frontend and add its production origin to Koyeb's `CLIENT_ORIGIN` if it differs from the configured value.

After changing `VITE_API_URL`, trigger a new Vercel build because Vite embeds `VITE_*` variables into the generated client bundle.

The GitHub repository is connected as the `origin` remote. Koyeb and Vercel still need to be authorized to access this repository from their respective dashboards.
