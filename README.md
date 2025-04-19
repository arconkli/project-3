This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your Supabase database:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Set up your database schema by following the instructions in `supabase/README.md`
3. Create a demo admin account using the script in `supabase/admin_account.sql`

Then, run the development server:

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

You can start editing the page by modifying `src/pages` files. The page auto-updates as you edit the files.

## Admin Access

After setting up the demo admin account, you can log in with:
- Email: admin@demo.com
- Password: admin123

## Project Structure

- `src/`: Source code for the application
  - `components/`: React components
  - `hooks/`: Custom React hooks 
  - `lib/`: Utility and library functions
  - `pages/`: Page components
  - `services/`: Service layer for API calls
  - `types/`: TypeScript type definitions
- `supabase/`: Supabase configuration and migrations
  - `migrations/`: SQL migration scripts
  - `admin_account.sql`: Script to create a demo admin account

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
