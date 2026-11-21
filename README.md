# Markuplint Playground

[![Netlify Status](https://api.netlify.com/api/v1/badges/34829317-52d5-4843-be38-ce4c81f89ac1/deploy-status)](https://app.netlify.com/sites/markuplint-playground/deploys)

The source of Markuplint Playground (<https://playground.markuplint.dev/>).

## Development

To get started:

```shell
yarn install
```

To start a development server:

```shell
yarn run dev
```

If you want to modify GitHub workflow, you need to install `actionlint`.
See [Installation document](https://github.com/rhysd/actionlint/blob/main/docs/install.md).

### Preinstalled markuplint snapshot

To shorten the first `npm install` in WebContainer, `yarn build` also creates a snapshot of `node_modules` with `markuplint@latest` installed (`dist/snapshot/`, see `scripts/build-snapshot.ts`).
The playground mounts it and skips `npm install` when the requested packages match.

To try it with the development server:

```shell
yarn build:snapshot:dev # creates public/snapshot/ (git-ignored)
yarn dev
```

The `Update markuplint snapshot` workflow redeploys the site via a Netlify build hook (`NETLIFY_BUILD_HOOK` secret) when a new version of markuplint is published.

## Thanks

This playground is inspired by:

- [Stylelint Demo](https://stylelint.io/demo/)
- [ESLint Playground](https://eslint.org/play/)
- [Playground | typescript-eslint](https://typescript-eslint.io/play)
