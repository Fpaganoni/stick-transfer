<div align="center">
  <h1>🏑 Stick Transfer</h1>
  <p><strong>Job board and professional network for hockey: coaches, players, umpires and clubs.</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/Fpaganoni/stick-transfer/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI)](https://github.com/Fpaganoni/stick-transfer/actions/workflows/ci.yml)
[![Last commit](https://img.shields.io/github/last-commit/Fpaganoni/stick-transfer?style=for-the-badge&logo=git&logoColor=white)](https://github.com/Fpaganoni/stick-transfer/commits/main)
[![Top language](https://img.shields.io/github/languages/top/Fpaganoni/stick-transfer?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Repo size](https://img.shields.io/github/repo-size/Fpaganoni/stick-transfer?style=for-the-badge&logo=github)](https://github.com/Fpaganoni/stick-transfer)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![GraphQL](https://img.shields.io/badge/GraphQL-16-e10098?style=for-the-badge&logo=graphql&logoColor=white)](https://graphql.org/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-ff4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

[![Vitest](https://img.shields.io/badge/Vitest-unit-6e9f18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2ead33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9-f69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20ES%20%7C%20FR-blue?style=for-the-badge&logo=googletranslate&logoColor=white)](https://next-intl.dev/)

</div>

---

## 📋 Table of Contents

- [🎯 About](#-about)
- [✨ Features](#-features)
- [👤 Roles](#-roles)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📜 Scripts](#-scripts)
- [🧪 Testing](#-testing)
- [📁 Project Structure](#-project-structure)
- [🏗️ Architecture](#️-architecture)
- [🔄 CI](#-ci)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)

---

## 🎯 About

**Stick Transfer** (branded **Scordd**) connects the hockey community: clubs publish job opportunities, and coaches, players and umpires build professional profiles, apply, and talk to each other.

This repository is the **frontend**. It talks to a separate GraphQL + Socket.io backend.

---

## ✨ Features

- 💼 **Job opportunities** - browse, filter, apply and publish listings (coach, player, umpire positions)
- 💾 **Saved jobs** - stored server-side per account, so they follow the user across devices
- 👥 **Profiles** - player, coach, umpire and club profiles with trajectories and licence data
- 🔎 **Explore** - discover people and clubs, filter by role
- 💬 **Messaging** - direct messages between users
- 🔔 **Real-time notifications** - Socket.io, authenticated with the session cookie
- ✅ **Club verification** - clubs are reviewed before they are marked verified
- 🚩 **Reports** - flag content or users for moderation
- 📰 **News** - public news feed managed from the admin area
- 🛡️ **Admin dashboard** - users, clubs, jobs, news and reports (SUPERADMIN only)
- 🌍 **Internationalization** - English, Spanish and French via `next-intl`
- 🌗 **Light / dark theme**

---

## 👤 Roles

| Role         | Capabilities                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------- |
| `PLAYER`     | Browse and apply to jobs, build a profile                                                           |
| `CLUB`       | Post jobs, browse players, build a club profile (replaces the deprecated `CLUB_ADMIN`)              |
| `UMPIRE`     | Licence/certification profile, discoverable in Explore, the only role that can apply to umpire jobs |
| `SUPERADMIN` | Full access to `/admin`                                                                             |

Details: [docs/ROLE_PERMISSIONS_PLAN.md](docs/ROLE_PERMISSIONS_PLAN.md).

---

## 🛠️ Tech Stack

| Area         | Technology                                                                          |
| ------------ | ----------------------------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router), React 19, TypeScript (strict)                              |
| Styling / UI | Tailwind CSS 4, Radix UI, MUI, Framer Motion, Lucide icons                          |
| Data         | GraphQL (`graphql-request`), TanStack Query 5, GraphQL Codegen                      |
| State        | Zustand                                                                             |
| Forms        | React Hook Form + Zod                                                               |
| Real time    | Socket.io client                                                                    |
| i18n         | next-intl (`en`, `es`, `fr`)                                                        |
| Charts       | Recharts                                                                            |
| Security     | DOMPurify (`isomorphic-dompurify`), cookie session, route protection in `proxy.ts` |
| Testing      | Vitest, React Testing Library, Playwright                                           |
| Tooling      | pnpm, ESLint 9                                                                      |
| Hosting      | Vercel (Analytics + Speed Insights)                                                 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22 (same as CI)
- [pnpm](https://pnpm.io/) 9 (`corepack enable` is enough)
- The Stick Transfer GraphQL backend running (default `http://localhost:4000/graphql`)

### Installation

```bash
git clone https://github.com/Fpaganoni/stick-transfer.git
cd stick-transfer
pnpm install
```

### Environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
```

| Variable                            | Purpose                                  |
| ----------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_GRAPHQL_URL`           | GraphQL endpoint                         |
| `NEXT_PUBLIC_BACKEND_URL`           | Backend base URL                         |
| `NEXT_PUBLIC_SOCKET_URL`            | Socket.io server for notifications       |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary account used for image upload |

`NEXT_PUBLIC_*` values are baked at build time.

### Run

```bash
pnpm dev     # http://localhost:3000
```

---

## 📜 Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `pnpm dev`           | Start the dev server                         |
| `pnpm build`         | Production build                             |
| `pnpm start`         | Run the production server                    |
| `pnpm lint`          | ESLint                                       |
| `pnpm test`          | Vitest, single run                           |
| `pnpm test:watch`    | Vitest in watch mode                         |
| `pnpm test:coverage` | Coverage report (target 70% lines/functions) |
| `pnpm test:e2e`      | Playwright E2E                               |

---

## 🧪 Testing

- **Unit / component** (Vitest + Testing Library, jsdom) in `tests/components`, `tests/hooks`, `tests/stores`, `tests/lib`, `tests/graphql`.
- **E2E** (Playwright) in `tests/e2e`: job flow, umpire flow, saved jobs per account and clean logout. All GraphQL calls are mocked with `page.route()`, so no backend is needed. See [tests/e2e/README.md](tests/e2e/README.md), including how to handle SSR requests that cannot be intercepted.

---

## 📁 Project Structure

```text
.
├── app/[locale]/        # App Router, locale-segmented
│   ├── admin/           # SUPERADMIN dashboard
│   ├── opportunities/   # Job board
│   ├── explore/         # People and clubs discovery
│   ├── clubs/ profile/  # Club and user profiles
│   ├── messages/        # Direct messages
│   ├── news/            # News feed
│   ├── onboarding/      # First-run profile setup
│   └── login/ register/ oauth-redirect/ legal/ landing/
├── components/          # UI by feature (admin, clubs, news, opportunities, profile, layout, ui ...)
├── graphql/             # Queries and mutations by domain
├── hooks/               # Data, admin, real-time and UI hooks
├── stores/              # Zustand stores (auth, UI, notifications, filters)
├── lib/                 # GraphQL client, session, query client, socket client
├── i18n/ messages/      # next-intl config and en/es/fr translations
├── types/               # Shared TypeScript models
├── tests/               # Vitest + Playwright
├── docs/                # Design docs (role permissions)
└── proxy.ts             # Locale routing + protected route redirects
```

---

## 🏗️ Architecture

```text
UI components ──► feature hooks ──► graphql-request client ──► GraphQL backend
                     │
                     ├─► TanStack Query (cache, optimistic updates)
                     ├─► Zustand (auth, UI, notifications)
                     └─► Socket.io (real-time notifications)
```

- **Session:** cookie-based; logout clears the React Query cache and closes the socket. See `lib/session.ts` and `hooks/useLogout.ts`.
- **Route protection:** `proxy.ts` redirects unauthenticated users away from `/opportunities`, `/explore`, `/profile`, `/clubs`, `/messages`, `/onboarding` and `/admin`. The admin area is additionally guarded by role in `components/admin/admin-guard.tsx`.
- **Server state:** default stale time 60s, cache time 5m.

---

## 🔄 CI

GitHub Actions ([ci.yml](.github/workflows/ci.yml)) runs on push to `main`/`develop` and on PRs to `main`:

1. Type-check (`tsc --noEmit`)
2. Lint
3. Build
4. Unit tests
5. E2E tests (push only)

---

## 🗺️ Roadmap

Pending items, tracked in [PRE-LAUNCH.md](PRE-LAUNCH.md) and [RoadMap.md](RoadMap.md):

- [ ] Migrate `/opportunities`, `/profile/[id]`, `/clubs/[id]` to server components (SEO)
- [ ] `generateMetadata()` for social share previews
- [ ] Replace remaining `<img />` with `next/image`
- [ ] Filters in URL query params (shareable links)
- [ ] Standardize role enum casing and remove remaining `any` types

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch from `main`: `git checkout -b feature/amazing-feature`
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add amazing feature"`
4. Make sure `pnpm lint`, `pnpm test` and `pnpm build` pass
5. Push and open a Pull Request

---

<div align="center">
  <p><strong>Made with ❤️ by <a href="https://github.com/Fpaganoni">Fpaganoni</a></strong></p>
</div>
