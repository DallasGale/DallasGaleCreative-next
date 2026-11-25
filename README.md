This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database and migrations

Payload CMS stores content in Postgres (Neon in production). The schema is defined by the collections in `src/collections/` and changed only through migration files in `src/migrations/`. Dev-mode schema pushes are disabled (`push: false` in `src/payload.config.ts`), so **a schema change is not live until it has a migration**.

### Environment

- `DATABASE_URL` in `.env.local` controls which database every local command uses. Point it at a local Postgres database for development. Don't point it at production.
- Production's `DATABASE_URL` is set in the Vercel project. Don't copy `PG*`, `POSTGRES_*`, or Neon-only variables into `.env.local`; `pg` reads `PG*` variables as defaults when a URL is missing parts.

### Changing the schema

1. Edit a collection in `src/collections/` (for example, add a field to `posts.ts`).
2. Create a migration from the change:

   ```bash
   npx payload migrate:create add_post_subtitle
   ```

   This writes a timestamped `.ts` migration and a `.json` snapshot to `src/migrations/`.
3. Review the generated `up` and `down` functions in the new `.ts` file.
4. Apply it to your local database and check it:

   ```bash
   npx payload migrate
   npx payload migrate:status
   ```

5. Commit the new migration files (`.ts` and `.json`) with the collection change.

### Deploying

`npm run build` runs `payload migrate` before `next build`, so pending migrations are applied to the database in `DATABASE_URL` on every build. Don't deploy a collection change without its migration, or the site will fail with errors such as `relation "posts" does not exist`.

### Commands

| Command | What it does | Safe on production? |
| --- | --- | --- |
| `npx payload migrate:create <name>` | Creates a migration from schema changes | Local only |
| `npx payload migrate` | Applies pending migrations | Yes (also runs in `npm run build`) |
| `npx payload migrate:status` | Lists migrations and whether each has run | Yes (read-only) |
| `npx payload migrate:down` | Rolls back the last batch | No, only with a backup and a plan |
| `npx payload migrate:fresh` / `migrate:reset` / `migrate:refresh` | Drop or reset the schema | **Never on production** |

### If the migrate prompt appears

If `payload migrate` asks "It looks like you've run Payload in dev mode … Would you like to proceed?", a `dev` row exists in `payload_migrations` from an earlier dev-mode push. Answer `N` against production. Locally, delete that row once you've confirmed it is the only one:

```sql
delete from payload_migrations where batch = -1 and name = 'dev';
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
