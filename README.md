# Mini Library

A modern, full-featured library management system built with Next.js, featuring role-based access control (RBAC), book management, checkout system, and AI-powered book enrichment.

## Features

- 📚 **Book Management**: Create, edit, and manage books with chapters
- 🔐 **Authentication**: Email/password and Google OAuth authentication
- 👥 **Role-Based Access Control (RBAC)**: Flexible permission system with roles and permissions
- 📖 **Checkout System**: Manage book checkouts with due dates and late fees
- 🤖 **AI Integration**: OpenAI-powered book enrichment and content generation
- 📧 **Email Notifications**: Automated email reminders via Resend
- ⏰ **Background Jobs**: Scheduled reminders using QStash (Upstash)
- 🎨 **Modern UI**: Beautiful, responsive interface with dark mode support
- 🔍 **Search**: Full-text search capabilities for books

## Tech Stack

- **Framework**: Next.js 16 (Pages Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Auth.js)
- **UI Components**: Radix UI with Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Email Service**: Resend
- **Background Jobs**: QStash (Upstash)
- **AI Service**: OpenAI

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- **PostgreSQL** database (local or cloud-hosted)
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mini-library
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory and configure the following variables:

#### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mini_library?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"    # Your application URL

# Admin User (for seed script)
ADMIN_EMAIL="admin@library.com"
ADMIN_PASSWORD="admin123"
ADMIN_NAME="Admin User"
```

#### Optional Environment Variables

```env
# Application URL (defaults to http://localhost:3000)
APP_URL="http://localhost:3000"

# Google OAuth (optional - only if using Google sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Service - Resend (optional)
RESEND_API_KEY="re_your-resend-api-key"
EMAIL_FROM_ADDRESS="noreply@example.com"
EMAIL_FROM_NAME="Mini Library"

# QStash - Upstash (optional - for background jobs)
QSTASH_TOKEN="your-qstash-token"
QSTASH_URL="https://qstash.upstash.io/v2/publish"

# OpenAI (optional - for AI features)
OPENAI_API_KEY="sk-your-openai-api-key"

# Public API URL (if different from same-origin)
NEXT_PUBLIC_API_URL=""
```

### 4. Set Up the Database

#### Using Prisma Migrate

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
# or for development
npx prisma migrate dev
```

#### Seed the Database

The seed script will create:

- Default permissions and roles (Admin, Finance Manager, Editor, Customer)
- Sample books with chapters
- Admin user (from environment variables)

```bash
npm run prisma:seed
# or
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run qstash` - Start QStash development server (for local testing)
- `npm run prisma:seed` - Seed the database with initial data

## Project Structure

```
mini-library/
├── prisma/
│   ├── migrations/          # Database migrations
│   ├── schema.prisma         # Prisma schema
│   └── seed.ts              # Database seed script
├── public/                   # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── books/          # Book-related components
│   │   ├── checkouts/      # Checkout components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   │   ├── client/         # Client-side utilities
│   │   └── server/         # Server-side utilities
│   ├── pages/              # Next.js pages and API routes
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   └── books/          # Public book pages
│   ├── styles/             # Global styles
│   └── types/              # TypeScript type definitions
├── .env                     # Environment variables (not committed)
├── next.config.ts          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Deployment

### Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications. Follow these steps for a complete deployment:

#### Step 1: Prepare Your Repository

1. **Commit and push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

#### Step 2: Set Up Database

Choose one of these PostgreSQL options:

**Option A: Vercel Postgres (Recommended)**

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Create a new Postgres database
4. Copy the connection string (you'll use this as `DATABASE_URL`)

**Option B: External PostgreSQL Services**

- **Supabase**: [supabase.com](https://supabase.com) - Free tier available
- **Neon**: [neon.tech](https://neon.tech) - Serverless PostgreSQL
- **Railway**: [railway.app](https://railway.app) - Easy PostgreSQL setup
- **Render**: [render.com](https://render.com) - Managed PostgreSQL

#### Step 3: Deploy to Vercel

1. **Import your repository**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub/GitLab/Bitbucket account
   - Click "Add New..." → "Project"
   - Import your `mini-library` repository

2. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `prisma generate && prisma migrate deploy && next build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

   > **Note**: The `vercel.json` file is already configured with the correct build command.

3. **Add Environment Variables**

   In the Vercel dashboard, go to **Settings → Environment Variables** and add:

   **Required Variables:**

   ```
   DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=https://your-app.vercel.app
   APP_URL=https://your-app.vercel.app
   ADMIN_EMAIL=admin@library.com
   ADMIN_PASSWORD=your-secure-password
   ADMIN_NAME=Admin User
   ```

   **Optional Variables (add as needed):**

   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   RESEND_API_KEY=re_your-resend-api-key
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   EMAIL_FROM_NAME=Mini Library
   QSTASH_TOKEN=your-qstash-token
   QSTASH_URL=https://qstash.upstash.io/v2/publish
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

   > **Important**:
   - Generate `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
   - Update `NEXTAUTH_URL` and `APP_URL` after your first deployment with your actual Vercel domain
   - For Google OAuth, add your production callback URL: `https://your-app.vercel.app/api/auth/callback/google`

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - The first deployment will run migrations automatically (configured in `vercel.json`)

#### Step 4: Post-Deployment Setup

1. **Verify Database Migrations**
   - Check the build logs to ensure migrations ran successfully
   - If migrations failed, you can run them manually via Vercel CLI:
     ```bash
     npx vercel env pull .env.local
     npx prisma migrate deploy
     ```

2. **Seed the Database** (Optional)
   - Connect to your database and run:
     ```bash
     npm run prisma:seed
     ```
   - Or use Vercel CLI:
     ```bash
     npx vercel env pull .env.local
     npx prisma db seed
     ```

3. **Update Environment Variables**
   - After first deployment, update `NEXTAUTH_URL` and `APP_URL` with your actual Vercel domain
   - Redeploy to apply changes

4. **Configure Custom Domain** (Optional)
   - Go to **Settings → Domains**
   - Add your custom domain
   - Update `NEXTAUTH_URL` and `APP_URL` to match your custom domain

#### Step 5: Verify Deployment

1. Visit your deployed app: `https://your-app.vercel.app`
2. Test authentication (sign up/sign in)
3. Access admin panel (if seeded): `/admin/dashboard`
4. Verify database connectivity

#### Troubleshooting Vercel Deployment

**Build Fails with Prisma Errors:**

- Ensure `DATABASE_URL` is set correctly
- Check that Prisma Client is generated: `prisma generate` should run in build
- Verify database is accessible from Vercel's IP ranges

**Authentication Not Working:**

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your deployment URL
- For Google OAuth, ensure callback URL is added to Google Cloud Console

**Database Connection Issues:**

- Verify `DATABASE_URL` format is correct
- Check if your database allows connections from Vercel
- Some databases require IP whitelisting (Vercel uses dynamic IPs)

**Migrations Not Running:**

- Check build logs for migration errors
- Run migrations manually: `npx prisma migrate deploy`
- Ensure `DATABASE_URL` is accessible during build

#### Vercel CLI Deployment (Alternative)

You can also deploy using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Environment Variables per Environment

Vercel allows you to set different environment variables for:

- **Production**: `vercel --prod`
- **Preview**: Automatic for pull requests
- **Development**: `vercel dev`

Configure these in **Settings → Environment Variables** by selecting the appropriate environment.

### Other Deployment Platforms

#### Railway

1. Create a new project on [Railway](https://railway.app)
2. Add PostgreSQL database
3. Connect your GitHub repository
4. Add environment variables
5. Deploy

#### Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your repository
3. Add PostgreSQL database
4. Configure build and start commands:
   - Build: `npm install && npm run build`
   - Start: `npm start`
5. Add environment variables

#### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

Update `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: "standalone",
  // ... rest of config
};
```

## Database Management

### Running Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Prisma Studio

View and edit your database using Prisma Studio:

```bash
npx prisma studio
```

This opens a web interface at [http://localhost:5555](http://localhost:5555)

## Authentication

The application supports two authentication methods:

1. **Credentials (Email/Password)**: Traditional email and password authentication
2. **Google OAuth**: Sign in with Google account

To enable Google OAuth:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your `.env` file

## Role-Based Access Control (RBAC)

The system includes a flexible RBAC system with:

- **Roles**: Admin, Finance Manager, Editor, Customer
- **Permissions**: Granular permissions for different actions
- **User Management**: Assign roles to users through the admin panel

Default roles and permissions are created during the seed process.

## Environment Variables Reference

### Required Variables

| Variable          | Description                  | Example                                    |
| ----------------- | ---------------------------- | ------------------------------------------ |
| `DATABASE_URL`    | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `NEXTAUTH_SECRET` | Secret for JWT encryption    | Generate with `openssl rand -base64 32`    |
| `ADMIN_EMAIL`     | Admin user email             | `admin@library.com`                        |
| `ADMIN_PASSWORD`  | Admin user password          | `admin123`                                 |
| `ADMIN_NAME`      | Admin user name              | `Admin User`                               |

### Optional Variables

| Variable               | Description                | Default                 |
| ---------------------- | -------------------------- | ----------------------- |
| `APP_URL`              | Application base URL       | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     | -                       |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | -                       |
| `RESEND_API_KEY`       | Resend API key for emails  | -                       |
| `EMAIL_FROM_ADDRESS`   | Email sender address       | `noreply@example.com`   |
| `EMAIL_FROM_NAME`      | Email sender name          | `Mini Library`          |
| `QSTASH_TOKEN`         | QStash API token           | -                       |
| `QSTASH_URL`           | QStash API URL             | Auto-detected           |
| `OPENAI_API_KEY`       | OpenAI API key             | -                       |
| `NEXT_PUBLIC_API_URL`  | Public API URL             | Empty (same-origin)     |

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Check database credentials and permissions
- Ensure the database exists

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your application URL
- For Google OAuth, verify redirect URIs are configured correctly

### Build Errors

- Clear `.next` directory: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Regenerate Prisma Client: `npx prisma generate`

### Migration Issues

- Ensure database is accessible
- Check migration files for errors
- Use `npx prisma migrate reset` (development only) to start fresh

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions, please open an issue in the repository or contact issahab2@gmail.com.

---

Built with ❤️ using Next.js and modern web technologies by Issa Habhab.
