# Contributing

Thanks for wanting to help out. This is a small codebase with strict checks, so most of contributing is knowing where things are.

## Setup

Fork, clone, `npm install` (Node 22+). That also builds the server to `dist/`.

```sh
npm run build     # compile to dist/
npm test          # vitest
npm run lint      # eslint
npm run inspect   # open the MCP Inspector against the built server
```

CI runs the build, lint and tests on every pull request. Coverage must stay at 100%. Run `npx vitest run --coverage` to see where you stand.

To test against the real API, create a `.env` with `GLESYS_PROJECT_KEY` and `GLESYS_API_KEY`, then use `npm run inspect` to poke at the server interactively. The API key must allowlist your IP and the modules you call, otherwise everything returns 403.

## Adding a tool

Read [AGENTS.md](AGENTS.md) first. It is the checklist for this repo, for humans as much as for agents. The short version:

- Every argument gets a zod `.describe()` that encodes formats and limits.
- Every tool gets annotations (`READ`, `WRITE`, `UPDATE`, `DESTRUCTIVE` from `src/client.ts`). Tests enforce that destructive tools are named like deletions and that list/details tools are read-only.
- New API methods go in `src/glesys-api.d.ts` and the list in `tests/shim.test.ts`.
- The tool count in `tests/server.test.ts` and the tools table in the README move in the same commit.

Mind the Glesys API's quirks: boolean-looking arguments are often `"yes"`/`"no"` strings, some enums are case-sensitive, and some ids are comma-separated. When a tool transforms values like that, it needs a test in `tests/tools/`.

## Pull requests

Small, focused pull requests merge fastest. One logical change per commit, imperative subject ("Add server_console tool", not "Added server_console tool"). `main` is protected, so your pull request needs a green CI run to merge.

If you found a bug, an issue with reproduction steps is just as welcome as a fix.
