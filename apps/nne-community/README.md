# NNE × WESTDETRO

Production React application for the NNE community, rewards economy, private beat vault, messaging integrations, and the invite-only NNE Distribution OS pilot.

- Frontend: React + TypeScript + Vite
- API: Cloudflare Pages Functions under `/api/nne/*`
- Database: Cloudflare D1 with `nne_*` namespaces
- Private media: Cloudflare R2
- Distribution pilot: `/distribution`

See [NNE_DISTRIBUTION_OS.md](../../docs/NNE_DISTRIBUTION_OS.md) for the release workflow, storage boundaries, provider adapter contract, and production gates.
