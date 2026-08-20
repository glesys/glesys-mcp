# glesys-mcp

MCP server exposing the Glesys API as tools. TypeScript, ESM, Node 22+, official MCP SDK, stdio transport. API access goes through the untyped `glesys-api` npm package; `src/glesys-api.d.ts` is a hand-written type mirror.

## Commands

```sh
npm test          # vitest, coverage must stay at 100%
npm run lint      # eslint (also enforces blank-line style)
npm run build     # tsc to dist/
npm run inspect   # MCP Inspector against the built server
```

Live testing needs a `.env` (gitignored) with `GLESYS_PROJECT_KEY` and `GLESYS_API_KEY`. The API key must allowlist both the caller's IP and the used modules, or everything returns 403.

## Adding or changing a tool

The Glesys API is RPC-style (`POST /module/function`, Basic auth) and self-describing, with some caveats:

1. Check `GET https://api.glesys.com/<module>` (anonymous) for the function list and arguments.
2. The introspection may not reflect actual behavior exactly; some listed arguments are unused by some functions. Verify against the live API when in doubt.
3. Watch for value formats: many boolean-looking arguments are `yesno` strings (map JS booleans to `"yes"`/`"no"` in the handler), some enums are case-sensitive (`kvm`, not `KVM`, for privatenetwork), some ids are comma-separated strings.
4. Never send `projectkey`; the API force-merges it from the session.

Checklist per tool:

- zod `inputSchema` with `.describe()` on every argument, encoding limits and formats so the model does not learn them through 400s
- annotations from `src/client.ts`: `READ`, `WRITE`, `UPDATE` or `DESTRUCTIVE`. Naming is enforced by tests: destructive tools must be named `*_delete`/`*_destroy`/`*_remove`/`*_release`, and list/details/cost-style names must be read-only
- method added to `src/glesys-api.d.ts` and to the list in `tests/shim.test.ts` (this is what catches typos against the untyped package)
- tool count bumped in `tests/server.test.ts`, sample args added if the tool has new required argument names
- behavior transforms (yes/no mapping, joins, normalization) get a test in `tests/tools/<module>.test.ts`
- README updated: the tools table and the allowed-modules list in the API key section
- coverage stays at 100% (statements, branches, functions, lines) — run `npx vitest run --coverage`. Only `src/index.ts` and `tests/testing.ts` are excluded (see `vitest.config.ts`); do not add exclusions to dodge a missing test

## Conventions

- Tool names: `<group>_<verb>` snake_case
- Tool descriptions are for the model: short, workflow hints ("call server_allowedarguments first"), cost warnings on paid operations. No links; the MCP handshake instructions in `src/server.ts` carry the documentation URLs
- Blank line before `return` and between logical blocks (eslint-enforced)
- Company name is spelled "Glesys", never "GleSYS"
- Commits: imperative subject only, one logical change per commit, no Co-Authored-By
