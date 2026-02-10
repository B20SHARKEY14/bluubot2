# Bluubot 

Quick setup instructions:

- Copy `.env.example` to `.env` and set `DISCORD_TOKEN`.
- Install dependencies:

```bash
npm install
```

- Run in development (auto-reloads with `nodemon` + `ts-node`):

```bash
npm run dev
```

- Build and run:

```bash
npm run build
npm start
```

I've created a minimal `src/index.ts` that logs the bot in and stubs command handling.
