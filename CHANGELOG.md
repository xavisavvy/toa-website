# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.3.0](https://github.com/xavisavvy/toa-website/compare/v2.2.3...v2.3.0) (2026-10-29)


### Features

* **01-01:** add campaigns helper lib (youtube id/thumb, lookups, sort) ([0cba89a](https://github.com/xavisavvy/toa-website/commit/0cba89a06ef57138ac7177ec160d06748227b797))
* **01-01:** add TVSeries / TVEpisode / PodcastEpisode JSON-LD factories ([864537a](https://github.com/xavisavvy/toa-website/commit/864537a3a4d50dd6bfc67a60d672a23258a4ca8e))
* **01-01:** add Zod schemas for campaigns & episodes ([2815954](https://github.com/xavisavvy/toa-website/commit/28159544a4b45ad45d3ea857b5aa214bd90a1ee8))
* **01-01:** implement /campaigns index page with status filter ([ddc0655](https://github.com/xavisavvy/toa-website/commit/ddc0655023e83c235d7a605610a48ded90daa8fe))
* **01-01:** implement /campaigns/:slug detail page with TVSeries JSON-LD ([acbbe2b](https://github.com/xavisavvy/toa-website/commit/acbbe2b64749d5bc148fd7e41eed9a5b6756b0ee))
* **01-01:** implement /campaigns/:slug/episodes/:n page with VideoObject JSON-LD ([d246760](https://github.com/xavisavvy/toa-website/commit/d2467605e230836c8a6150c67faa589b29488eff))
* **01-01:** seed campaigns/episodes JSON + lock with integrity test ([33c74b3](https://github.com/xavisavvy/toa-website/commit/33c74b3540620bde800d2728099a806e8f481a19))
* **01-01:** wire campaign routes in App.tsx + add Campaigns nav entry ([96a4fc0](https://github.com/xavisavvy/toa-website/commit/96a4fc09c8f8939e6f76f9206c4978140d713984))
* **02-01:** add cast helpers (getCastMemberById, getCastSocialUrls) ([6f1aee4](https://github.com/xavisavvy/toa-website/commit/6f1aee43b1dcaaf43fde2942b51071df8bf1ea39))
* **02-01:** add Phase 2 Zod schemas for character lore + image source taxonomy ([1a5e50e](https://github.com/xavisavvy/toa-website/commit/1a5e50ed641934a25cb96c42a6719ca73563c943))
* **02-01:** extend CharacterDetail — lore cards + gallery badges + Person JSON-LD ([b95533f](https://github.com/xavisavvy/toa-website/commit/b95533f66ee221b2e9084c21e1b62d4f7d0138c6))
* **02-01:** migrate characters.json + lock with integrity test ([7d036a9](https://github.com/xavisavvy/toa-website/commit/7d036a9a595ab5420f30e923e23b63069b5ff04c))
* **03-01:** add /podcast page with vertical episode list + subscribe strip ([e96aac4](https://github.com/xavisavvy/toa-website/commit/e96aac4849f4a7c7e58c21e7349b9a8be07e8741))
* **03-01:** add /videos page with paginated grid + filter chips ([9278e05](https://github.com/xavisavvy/toa-website/commit/9278e05597a76614205a142a56362b3abaac3bc1))
* **03-01:** retarget home CTAs to internal /videos and /podcast routes ([52badb3](https://github.com/xavisavvy/toa-website/commit/52badb376e0076f0719882ce23a4972fdbe3b4c5))
* **03-01:** wire /videos and /podcast routes; update Navigation ([cbfc06d](https://github.com/xavisavvy/toa-website/commit/cbfc06d1de6b465596e5bd83773607043836ad04))
* add enterprise CI/CD enhancements ([3c8f75b](https://github.com/xavisavvy/toa-website/commit/3c8f75bb97a41373fd6b16e099bf925cfa5266b3))
* add Halloween week premiere time to Pterrordale promo ([1055e0d](https://github.com/xavisavvy/toa-website/commit/1055e0d4b072146551c6b9fba2b555544181260d))
* add Kevin Kambridge HeroForge portrait ([c2d7db5](https://github.com/xavisavvy/toa-website/commit/c2d7db5418150474c47bf03c0dd32fc3f76dc3fe))
* add npm run up/down for local docker dev workflow ([4d23aa9](https://github.com/xavisavvy/toa-website/commit/4d23aa9d7205d47df0e23d8631df39967e8b610b))
* add Pterrordale 2026 one-shot characters and promo ([2f115e9](https://github.com/xavisavvy/toa-website/commit/2f115e90e7c5955566ee260371adda117fdc48ed))
* add Pterrordale characters to cast member character lists ([5144e4d](https://github.com/xavisavvy/toa-website/commit/5144e4d557bc0a47fa74bc675f423872c741d854))
* add Trevor's art and fix hidden image badges ([2d1a134](https://github.com/xavisavvy/toa-website/commit/2d1a134367e404220efd368d642f6a6a481a4a6a))
* **deploy:** target AWS Lightsail VPS instead of Replit ([8866a6b](https://github.com/xavisavvy/toa-website/commit/8866a6bdab8997e6245fc27f856d492318c8c32a))
* enhance webhook handling and update dependencies ([a898778](https://github.com/xavisavvy/toa-website/commit/a898778bdc4e8152877de3ca5d1d927cfed7de87))
* link Pterrordale promo to the YouTube premiere ([54da0bb](https://github.com/xavisavvy/toa-website/commit/54da0bb70efc6a959c2e55d0a110a2e9be889634))
* list Pterrordale characters first on cast cards ([060dad4](https://github.com/xavisavvy/toa-website/commit/060dad466a35dc9147fbcfdbfad0c3042927fb61))
* record GitHub Deployments for staging/production rollouts ([a413997](https://github.com/xavisavvy/toa-website/commit/a41399742dea6a359b7152cf33f103111635cd4a))
* record GitHub Deployments for staging/production rollouts ([#37](https://github.com/xavisavvy/toa-website/issues/37)) ([382585a](https://github.com/xavisavvy/toa-website/commit/382585a3b2098e3b4c7ef7b71121070afeb97583))
* set Pterrordale premiere to Wednesday, October 28 ([360946c](https://github.com/xavisavvy/toa-website/commit/360946cec9bd208e549dbdb7ef609c4397cb52ac))
* unify campaign world data source and merge Taebrin/Forgotten Gods ([9c0c9e3](https://github.com/xavisavvy/toa-website/commit/9c0c9e3db621f7fcdcb412af554b0fed97e07e2f))
* unify campaign world data source and merge Taebrin/Forgotten Gods ([#36](https://github.com/xavisavvy/toa-website/issues/36)) ([23cae39](https://github.com/xavisavvy/toa-website/commit/23cae39fe50f6923134b3b22ae484352edae9000))
* updated character descriptions ([ef92428](https://github.com/xavisavvy/toa-website/commit/ef92428853dd406084498f7b050a080bf7073ec6))
* use HeroForge model as Jax Xerowraith's featured portrait ([bcc5c02](https://github.com/xavisavvy/toa-website/commit/bcc5c029d6dea2f0919df9d8fc8e8f1f25c2e444))
* use HeroForge models for Gizmo and Jessica M. portraits ([ec7e738](https://github.com/xavisavvy/toa-website/commit/ec7e73888181871d5ede48dbbde9587870040273))


### Bug Fixes

* add missing preview script for Lighthouse CI ([665c5ef](https://github.com/xavisavvy/toa-website/commit/665c5ef2e6eee3c21fff142cd3ed6094d1b8f8f3))
* address CodeQL security alerts [#3](https://github.com/xavisavvy/toa-website/issues/3)-[#21](https://github.com/xavisavvy/toa-website/issues/21) ([f20eeab](https://github.com/xavisavvy/toa-website/commit/f20eeab2b4b202d8100a0bcfb77a131511f7a523))
* address open CodeQL alerts (SSRF, open redirect, command line, test cookies) ([1c0778c](https://github.com/xavisavvy/toa-website/commit/1c0778c4c2c1e518cd667f6cad3cbc33a0b9c58e))
* **admin:** don't require UUID format for order IDs ([13be10d](https://github.com/xavisavvy/toa-website/commit/13be10d9f163742ec1e519136e32aefa690998e2))
* **checkout:** use a real state in Printful estimates; per-unit email price ([90a6495](https://github.com/xavisavvy/toa-website/commit/90a6495362d2162b2be7c8d85ea2b044cfea112f))
* **ci:** pin trivy-action to v0.35.0 SHA (CVE-2026-33634) ([ef2b78b](https://github.com/xavisavvy/toa-website/commit/ef2b78b3bee7290c5bb6c463aa9edc6e639f0322))
* **ci:** remove redundant Run contract tests step ([88c6a2f](https://github.com/xavisavvy/toa-website/commit/88c6a2ff1b15f024f71da1c72833c8e7e5ea2389))
* **ci:** unbreak the scan build, license check, and SBOM generation ([324e384](https://github.com/xavisavvy/toa-website/commit/324e38444776a4b6da982eeecba598d931a00023))
* **ci:** unbreak the scan build, license check, and SBOM generation ([#39](https://github.com/xavisavvy/toa-website/issues/39)) ([f1ff690](https://github.com/xavisavvy/toa-website/commit/f1ff690372b68a1ab989b9d74b279a58186d7e24))
* clear eslint warnings in server/index.ts's CSRF middleware ([3cff7da](https://github.com/xavisavvy/toa-website/commit/3cff7da81db05a08b781b7f244d8fc0be94d1613))
* **deploy:** authenticate to GHCR with the run's ephemeral token ([277fe14](https://github.com/xavisavvy/toa-website/commit/277fe1435dc7117107a20bbe501667c1546b723b))
* **deploy:** pin auto-deploys to the triggering commit's image, not latest ([3419954](https://github.com/xavisavvy/toa-website/commit/341995473575798c39dde02b60a6bdf94540f63c))
* **deps:** bump esbuild override to ^0.28.2 ([1740756](https://github.com/xavisavvy/toa-website/commit/17407561de2fa70979e14b56729124b16fdab801))
* **deps:** bump zod-validation-error to 5.0.0 for zod v4 compatibility ([3fba0a1](https://github.com/xavisavvy/toa-website/commit/3fba0a180e1b16504f1fc3e2c7a8185d6761c2b8))
* **deps:** override uuid to 11.1.1 to resolve @lhci/cli's vulnerable direct dependency ([a88bff5](https://github.com/xavisavvy/toa-website/commit/a88bff57ab93e155ee24134b785ce76e2702598c))
* **deps:** patch vulnerable vitest, postcss-selector-parser, fflate and basic-ftp ([0e0a329](https://github.com/xavisavvy/toa-website/commit/0e0a32956abe72a5e77ed832fea1ac43a2ed577c))
* **deps:** resolve all 51 npm audit vulnerabilities ([2e2588a](https://github.com/xavisavvy/toa-website/commit/2e2588abe027474de29b16d1337402022ac295d3))
* **deps:** resolve npm audit vulnerabilities (52 -&gt; 7) ([cf19689](https://github.com/xavisavvy/toa-website/commit/cf19689c203d79afb92d47a61d429588043b3e34))
* **deps:** resolve npm audit vulnerabilities (52 → 7) ([cf19689](https://github.com/xavisavvy/toa-website/commit/cf19689c203d79afb92d47a61d429588043b3e34))
* **deps:** scope ajv override to stryker; bump brace-expansion to ^5.0.5 ([e4fd24d](https://github.com/xavisavvy/toa-website/commit/e4fd24d99a00cea66a91ed49d845f6ee1acb0684))
* **deps:** security upgrade @aws-sdk/client-ses from 3.962.0 to 3.974.0 ([0d7c3be](https://github.com/xavisavvy/toa-website/commit/0d7c3be5416fbbfeff5525c35876710d58b15f31))
* **deps:** upgrade ioredis to 6.0.0 ([93b6ad2](https://github.com/xavisavvy/toa-website/commit/93b6ad25de84b001872da0c96fc86f0dd2034a1b))
* **docker:** copy scripts/ into the builder stage ([cb6d7d7](https://github.com/xavisavvy/toa-website/commit/cb6d7d73c6e735dc5b4b1902697eb7ba6e48974e))
* **docker:** let SBOM generation tolerate the deliberate esbuild override ([81d73e5](https://github.com/xavisavvy/toa-website/commit/81d73e5e750419cdf01f97beffc02a08c78be022))
* **e2e:** __dirname undefined in ESM breaks campaigns.spec.ts ([#42](https://github.com/xavisavvy/toa-website/issues/42)) ([8fdad01](https://github.com/xavisavvy/toa-website/commit/8fdad01b0a8a9cdc8163eca542fde3b99fc08bb5))
* e2e/campaigns.spec.ts uses __dirname, undefined in ESM ([a32b856](https://github.com/xavisavvy/toa-website/commit/a32b856e800372e899c6a39b87f96795852dd97e))
* **e2e:** add missing session_id to checkout-flow cart-clearing test ([f495ff3](https://github.com/xavisavvy/toa-website/commit/f495ff36b8973908abf4c91f16638f611974dab1))
* **e2e:** fix ~55 pre-existing E2E test failures and 4 real app bugs ([ee9fac4](https://github.com/xavisavvy/toa-website/commit/ee9fac48a6bb4d31b275acd736b07335d49372e8))
* **e2e:** regenerate visual-regression baselines for Linux CI, fix stale selectors ([0811c6b](https://github.com/xavisavvy/toa-website/commit/0811c6b89eb5c2160cf66ce8e4965b006d77c490))
* **e2e:** stop apiLimiter exhaustion from failing unrelated E2E specs, fix stale /api/characters load-stress tests ([99bc7e6](https://github.com/xavisavvy/toa-website/commit/99bc7e6a435493b6eda5b94bd88b50a03b2ab2ca))
* **e2e:** unblock and stabilize the full Playwright E2E suite ([#41](https://github.com/xavisavvy/toa-website/issues/41)) ([57ce830](https://github.com/xavisavvy/toa-website/commit/57ce83037517846ad7c691fb8d33d0e890ae956b))
* **e2e:** use fileURLToPath for __dirname under ESM in campaigns.spec.ts ([55eef83](https://github.com/xavisavvy/toa-website/commit/55eef8393089ef7e30aed99c13420736dfca765e))
* fall back to channel-wide YouTube search when a campaign's playl… ([#46](https://github.com/xavisavvy/toa-website/issues/46)) ([15dc309](https://github.com/xavisavvy/toa-website/commit/15dc309fd5725ee98bc93ea18006c5277bd318f2))
* fall back to channel-wide YouTube search when a campaign's playlist is stale ([6ef9741](https://github.com/xavisavvy/toa-website/commit/6ef974150fb52d7244056a57638db7d4e757513a))
* give the server the podcast feed URL the client was built with ([4380d0a](https://github.com/xavisavvy/toa-website/commit/4380d0a8b7611c4222d53415408f0499773191ee))
* hide Special Offers section when no active promotions ([fc12517](https://github.com/xavisavvy/toa-website/commit/fc125176eb89c8adbbb1dce3b2de207995dcb03b))
* hide Special Offers section when no active promotions ([#35](https://github.com/xavisavvy/toa-website/issues/35)) ([3dbdde7](https://github.com/xavisavvy/toa-website/commit/3dbdde705c3e07929c622c296927f137e7b4003e))
* **lint:** clear all 363 ESLint errors (0 errors, 522 warnings remain) ([74167b7](https://github.com/xavisavvy/toa-website/commit/74167b78af34438c5914810904a4fe535c992ab2))
* loosen rate limits that 429'd normal page loads ([ef07a97](https://github.com/xavisavvy/toa-website/commit/ef07a970a487eecf988c82bccd0b4b238aff4964))
* only proxy audio for episodes in the cached podcast feed ([5c36faf](https://github.com/xavisavvy/toa-website/commit/5c36fafc13f821aee0756b7e53d0a5ba4eefb039))
* package.json & package-lock.json to reduce vulnerabilities ([0d7c3be](https://github.com/xavisavvy/toa-website/commit/0d7c3be5416fbbfeff5525c35876710d58b15f31))
* pin CloudFront audio allowlist to Anchor's distribution ([f034307](https://github.com/xavisavvy/toa-website/commit/f03430788a13ef6ea6c6331c34172a8fd847faf7))
* pin podcast feed URL server-side to prevent cache poisoning ([a14c024](https://github.com/xavisavvy/toa-website/commit/a14c024af7cb8cd6fccf6143c38549e3d0b6bbaa))
* pin Trivy to specific version for deterministic builds ([291933d](https://github.com/xavisavvy/toa-website/commit/291933dce7f6b902e88ca15de67ceee033c761a6))
* pin Trivy to specific version for deterministic builds ([58a42a9](https://github.com/xavisavvy/toa-website/commit/58a42a9e4396ad7985267a58a9a390db78b0733b))
* **podcast:** stop the /podcast page 400ing on every load ([c942f36](https://github.com/xavisavvy/toa-website/commit/c942f36758d5db44dc9e005184fc081cf4da565f))
* remove duplicate __dirname declaration left by merge, refresh stale CI comments ([78f9ad4](https://github.com/xavisavvy/toa-website/commit/78f9ad42a267fc4de1e085ffcb5f5ffb7166170f))
* replace lucide-react brand icons removed in 1.x with react-icons ([53c9592](https://github.com/xavisavvy/toa-website/commit/53c959258e3fccf2c78c595eea7393be3757a5b7))
* replace sudo-based Trivy install with user-level installer in SBOM workflow ([f34f147](https://github.com/xavisavvy/toa-website/commit/f34f1475320e76b435fee07fbaf6b7428b6cd76f))
* replace sudo-based Trivy install with user-level installer in SBOM workflow ([#45](https://github.com/xavisavvy/toa-website/issues/45)) ([172b524](https://github.com/xavisavvy/toa-website/commit/172b5245980bcc16c671abdeb9e66719f7edc8da))
* resolve 14 CodeQL security alerts (CSRF, rate limiting, ReDoS, command injection, cookie flags, workflow permissions) ([#43](https://github.com/xavisavvy/toa-website/issues/43)) ([3211cd6](https://github.com/xavisavvy/toa-website/commit/3211cd60e976d87de36758e4770b6b321f1eec4e))
* resolve all ESLint warnings across the codebase ([741cae3](https://github.com/xavisavvy/toa-website/commit/741cae3971644ad81ad9ad402a58aff0d64d4fbc))
* resolve all ESLint warnings across the codebase ([#44](https://github.com/xavisavvy/toa-website/issues/44)) ([6e110ab](https://github.com/xavisavvy/toa-website/commit/6e110ab4dc3d3dcad8d6dc4648bec3fcf08ef0f6))
* resolve merge conflicts with origin/main ([6501357](https://github.com/xavisavvy/toa-website/commit/65013573700cf3d715c0da1e1661aeef80876515))
* restore mocked fetch after each test (unbreak unused-import lint error) ([df241ab](https://github.com/xavisavvy/toa-website/commit/df241abf59988d534c2772418f189d9d6dc7ade8))
* **security:** hard-gate E2E_DISABLE_RATE_LIMIT off production ([75650f6](https://github.com/xavisavvy/toa-website/commit/75650f62373e56d4979e55132152e2c5b211e56d))
* **security:** price checkout server-side, stop logout crash, verify Printful webhooks in prod ([a169df5](https://github.com/xavisavvy/toa-website/commit/a169df5e42de775e3590cf9ef1d85f98dfdf340a))
* **security:** remediate remaining council review findings ([51fa659](https://github.com/xavisavvy/toa-website/commit/51fa6596ca1092150f69620c370b9545f1b473f4))
* **seo:** regenerate sitemap from real data and resolve indexing conflicts ([5e2b228](https://github.com/xavisavvy/toa-website/commit/5e2b228ef12c796b5452de2a2e69cbb730500343))
* **server:** unblock tsc and Windows local dev server bind ([3b93e19](https://github.com/xavisavvy/toa-website/commit/3b93e192605d5b63c8b2a36770b20247fbc59787))
* sync campaign episode links from the world's real YouTube playlist ([8ea729f](https://github.com/xavisavvy/toa-website/commit/8ea729f9a449f627ad7b3183ac254d3689ca8893))
* sync campaign episode links from the world's real YouTube playlist ([#40](https://github.com/xavisavvy/toa-website/issues/40)) ([8035ae0](https://github.com/xavisavvy/toa-website/commit/8035ae06a396c75faec82db75617e12fdd502670))
* **test:** stop rebuilding the Express app before every webhook test ([345130a](https://github.com/xavisavvy/toa-website/commit/345130a3f67fee17ef87da324cd10868cf515827))
* tighten CSRF token validation — reject state-changing requests with no session token ([acec864](https://github.com/xavisavvy/toa-website/commit/acec864374eae973f68173ec8d9b1ec83af100e3))
* update Trivy to use latest version ([b5d8f08](https://github.com/xavisavvy/toa-website/commit/b5d8f08acf8ac3ebbd193c904551f847c1f4231e))
* upgrade @tanstack/react-query from 5.60.5 to 5.90.18 ([b44b963](https://github.com/xavisavvy/toa-website/commit/b44b96324bd97203eabad33c5d5089ee00cc3dd5))
* use bash pipefail and verify Trivy binary after install in sbom.yml ([0c091ed](https://github.com/xavisavvy/toa-website/commit/0c091ed672dee6fd41f88cdd31befeb5aa5bbd44))
* validate audio URLs against configured podcast feed ([5bf3012](https://github.com/xavisavvy/toa-website/commit/5bf3012684b285c7f6856624a671f3d739dd375c))


### Performance Improvements

* fix Lighthouse CI issues - add image dimensions, enable source maps, improve touch targets ([75ffea5](https://github.com/xavisavvy/toa-website/commit/75ffea5188f554e15cf79922a8a60feb5ef7b921))


### Code Refactoring

* **03-01:** extract PodcastSubscribeStrip from PodcastSection ([083c407](https://github.com/xavisavvy/toa-website/commit/083c407ecccad0a642ad39bcdb744b09e2ada434))


### Reverts

* undo two Copilot Autofix changes, keep the third ([c6efc81](https://github.com/xavisavvy/toa-website/commit/c6efc819c05b40c3e907e111d55e04a6d6b308ce))

### [2.2.3](https://github.com/xavisavvy/toa-website/compare/v2.2.2...v2.2.3) (2026-01-05)


### Bug Fixes

* add skip condition to ALL CI jobs for version commits ([95ce469](https://github.com/xavisavvy/toa-website/commit/95ce4692715565a350d598d1e6555449ebba6a30))
* implement proper workflow chain and prevent infinite loops ([7e966e7](https://github.com/xavisavvy/toa-website/commit/7e966e7620b268711f835228916fbc1ce485a0f3))

### [2.2.2](https://github.com/xavisavvy/toa-website/compare/v2.2.1...v2.2.2) (2026-01-05)


### Bug Fixes

* correct SPDX SBOM generator and flaky monitoring tests ([82a6156](https://github.com/xavisavvy/toa-website/commit/82a61562d7c340ee534d870cdd30e9d885bed534))
* correct SPDX SBOM generator installation ([58b89e9](https://github.com/xavisavvy/toa-website/commit/58b89e962c5abd4d453ec1cba2e817a4b82c6824))

### [2.2.1](https://github.com/xavisavvy/toa-website/compare/v2.2.0...v2.2.1) (2026-01-05)


### Bug Fixes

* install Trivy before generating SBOM vulnerability report ([da5df21](https://github.com/xavisavvy/toa-website/commit/da5df215e8e5a1747db22692d75968ca3bca8723))

## [2.2.0](https://github.com/xavisavvy/toa-website/compare/v2.1.4...v2.2.0) (2026-01-05)


### Features

* add E2E test database seeding infrastructure ([05f5ea3](https://github.com/xavisavvy/toa-website/commit/05f5ea3ed3ba2911ed060ffa2c1eca49c830f064))

### [2.1.4](https://github.com/xavisavvy/toa-website/compare/v2.1.3...v2.1.4) (2026-01-05)


### Bug Fixes

* add default category for audit log security events ([3e2489f](https://github.com/xavisavvy/toa-website/commit/3e2489f40ae4d45f5d0174683ff51ddb45562788))

### [2.1.3](https://github.com/xavisavvy/toa-website/compare/v2.1.2...v2.1.3) (2026-01-05)


### Bug Fixes

* resolve TypeScript errors in YouTube API handling ([2678917](https://github.com/xavisavvy/toa-website/commit/26789171c861a4502f628f9771d1b266765ada35))

### [2.1.2](https://github.com/xavisavvy/toa-website/compare/v2.1.1...v2.1.2) (2026-01-05)


### Bug Fixes

* adjust npm audit level to high and document esbuild vulnerability ([86af5cb](https://github.com/xavisavvy/toa-website/commit/86af5cb1b96d3f0a2a61bb547248532eeda72ee1))

### [2.1.1](https://github.com/xavisavvy/toa-website/compare/v2.1.0...v2.1.1) (2026-01-05)


### Bug Fixes

* improve error handling and test clarity ([87057c6](https://github.com/xavisavvy/toa-website/commit/87057c6f133191f805444452b79b7eeb2da28fe9))

## [2.1.0](https://github.com/xavisavvy/toa-website/compare/v2.0.0...v2.1.0) (2026-01-05)


### Features

* add Docker Compose test environment for E2E tests ([eb4bf6a](https://github.com/xavisavvy/toa-website/commit/eb4bf6a78319de8cd8041196571e584248ef4f98))
* skip E2E tests gracefully when database unavailable ([331cbee](https://github.com/xavisavvy/toa-website/commit/331cbee5035e27cb8bd444aa6be7ef0ea0ab26c3))


### Bug Fixes

* handle YouTube API gracefully in non-Replit environments ([5b7bef7](https://github.com/xavisavvy/toa-website/commit/5b7bef743a838ef69c9cba9a5a8af81ef4e1da75))
* simplify rate limiting test to prevent timeout ([13c6633](https://github.com/xavisavvy/toa-website/commit/13c6633ce65db70c3af749dbda2e801c51d4cefe))
* update Docker Compose syntax for v2 in GitHub Actions ([ea04a15](https://github.com/xavisavvy/toa-website/commit/ea04a15ac0d96cd6ca2ebd5bb3bbdd74d575d97f))
* use GH_PAT for version workflow to bypass branch protection ([cf81e32](https://github.com/xavisavvy/toa-website/commit/cf81e325d1758603f2be9ff3e3d29c19b491b510))

## [1.31.0](https://github.com/xavisavvy/toa-website/compare/v1.30.0...v1.31.0) (2026-01-02)


### Features

* Add AI-generated image badges and improve shop/privacy features ([45f3e02](https://github.com/xavisavvy/toa-website/commit/45f3e0242b7a3f96b297bd9382f7cced81a411f2))

## [1.30.0](https://github.com/xavisavvy/toa-website/compare/v1.29.0...v1.30.0) (2026-01-02)


### Features

* add AI-generated image badges to character pages ([60f6db4](https://github.com/xavisavvy/toa-website/commit/60f6db4a6aa94d9bdf3a6a8f9ffc23c71128ca5d))

## [1.29.0](https://github.com/xavisavvy/toa-website/compare/v1.28.3...v1.29.0) (2026-01-02)


### Features

* update Privacy Policy for Stripe and Printful integration ([564e362](https://github.com/xavisavvy/toa-website/commit/564e362e43086783f47c7fd419c1fbb0b84ae571))

### [1.28.3](https://github.com/xavisavvy/toa-website/compare/v1.28.2...v1.28.3) (2026-01-02)


### Bug Fixes

* resolve TypeScript linting issues ([df9d70d](https://github.com/xavisavvy/toa-website/commit/df9d70d24c074e0bbe0a3246df8f11458467c194))

### [1.28.2](https://github.com/xavisavvy/toa-website/compare/v1.28.1...v1.28.2) (2026-01-02)


### Bug Fixes

* improve shop search to include variant names in search results ([d18f776](https://github.com/xavisavvy/toa-website/commit/d18f77631a44cc1bc09d3f74669feef7718c919b))

### [1.28.1](https://github.com/xavisavvy/toa-website/compare/v1.28.0...v1.28.1) (2026-01-02)

## [1.28.0](https://github.com/xavisavvy/toa-website/compare/v1.27.0...v1.28.0) (2026-01-02)


### Features

* Add filtering and sorting to shop page ([7ea1812](https://github.com/xavisavvy/toa-website/commit/7ea1812f1e1302f82feae7dc0196ad3aecd6a5af))

## [1.27.0](https://github.com/xavisavvy/toa-website/compare/v1.26.0...v1.27.0) (2026-01-02)


### Features

* enhance shop page with full catalog and support options ([9f34ded](https://github.com/xavisavvy/toa-website/commit/9f34ded08edda3f336a5fee3778dbf0fd18cad80))

## [1.26.0](https://github.com/xavisavvy/toa-website/compare/v1.25.0...v1.26.0) (2026-01-02)


### Features

* Add Stripe donation link and enhance shop page support options ([2670ac7](https://github.com/xavisavvy/toa-website/commit/2670ac7fb5f4b6244f423da1047c1fd3f69a4719))
* create dedicated shop page ([aa86aaa](https://github.com/xavisavvy/toa-website/commit/aa86aaa198e44e29b12709efe7d0f2e7c40e2076))
* **shop:** Remove Etsy references and enhance support options ([c095476](https://github.com/xavisavvy/toa-website/commit/c0954766877df0f9f4ea43c49bbb65aeeccd109b))


### Performance Improvements

* Increase performance test threshold and fix ESLint errors ([67db2e7](https://github.com/xavisavvy/toa-website/commit/67db2e7d5206f4b851b544cf0958811d90b287dd))

## [1.25.0](https://github.com/xavisavvy/toa-website/compare/v1.24.5...v1.25.0) (2026-01-02)


### Features

* add comprehensive tests for PrintfulShop and LatestShorts ([9d2a420](https://github.com/xavisavvy/toa-website/commit/9d2a420b8f8bec9bc7ec4148be2ee725c8d2e8fb))
* add GitHub Actions cache cleanup script ([f5c18e9](https://github.com/xavisavvy/toa-website/commit/f5c18e92643b7a6bbe4876b6a30d98331c482f50))
* Add local development domain support and environment documentation ([fcc3276](https://github.com/xavisavvy/toa-website/commit/fcc3276ee09df9d8ee91b1e0d36f4d1393a1bf30))
* Add Printful integration as Etsy alternative ([8d719d7](https://github.com/xavisavvy/toa-website/commit/8d719d7ef3d3b857351dad202a0992bd3ee7edc1))
* Add Printful store integration with Stripe payments ([6b8dc6b](https://github.com/xavisavvy/toa-website/commit/6b8dc6b8ca037db90588ef0395d054b55a2d8848))
* Add Printful store integration with Stripe payments ([5025bb5](https://github.com/xavisavvy/toa-website/commit/5025bb55fdeceab6835a3fb83be85b3a0d00eda9))
* Add test script for local domain setup ([fdcb9b0](https://github.com/xavisavvy/toa-website/commit/fdcb9b0fb1e32eece0783e92b95f4acf7dc06dc4))
* Add YouTube Shorts section to homepage ([b6c5cbe](https://github.com/xavisavvy/toa-website/commit/b6c5cbeb06f1ddfc96a35c2486416ee0397f0840))
* Complete Stripe checkout integration ([2d33721](https://github.com/xavisavvy/toa-website/commit/2d33721ac0861454d4e73de1e0b041b7d2588fcc))
* implement graceful health check degradation ([f36809a](https://github.com/xavisavvy/toa-website/commit/f36809ab36fd34f243598d10d0f738aa2d05b5fe))
* Improve sponsors page with industry best practices ([8a26691](https://github.com/xavisavvy/toa-website/commit/8a266912dfd666511ad38f5b489ed1e0a3c1430a))
* Phase 2 - Automatic Printful order creation + ENV tracking ([2128f92](https://github.com/xavisavvy/toa-website/commit/2128f9222e42684f78a6dd2caa716ae1d046cd51))
* Switch to PrintfulShop with Stripe checkout enabled ([d7659cb](https://github.com/xavisavvy/toa-website/commit/d7659cb58521a9cab52aec87aba563abe9d97e19))


### Bug Fixes

* Add Stripe and Printful to CSP + lint fixes ([f5c090d](https://github.com/xavisavvy/toa-website/commit/f5c090d5e55d8f3d7e8edb505c63c7df44e49fb9))
* Docker Compose issues for Windows ([dca75cf](https://github.com/xavisavvy/toa-website/commit/dca75cff93d8b9caf4cdd4e30190f7c85764a628))
* implement pagination for GitHub CLI cache fetching ([332537d](https://github.com/xavisavvy/toa-website/commit/332537dddb46a8f7615f182622d8133555d67caa))
* PostCSS 'from' option warning ([41c160b](https://github.com/xavisavvy/toa-website/commit/41c160bba017a5e236d95f9074b1f98ea8a091cc))
* Redis Docker permission error for Windows ([8ec1af4](https://github.com/xavisavvy/toa-website/commit/8ec1af49006ea5d1e97bb62b926a14c99ccdab73))

### [1.24.6](https://github.com/xavisavvy/toa-website/compare/v1.24.5...v1.24.6) (2026-01-02)

### [1.24.5](https://github.com/xavisavvy/toa-website/compare/v1.24.4...v1.24.5) (2026-01-02)

### [1.24.4](https://github.com/xavisavvy/toa-website/compare/v1.24.3...v1.24.4) (2026-01-02)

### [1.24.3](https://github.com/xavisavvy/toa-website/compare/v1.24.2...v1.24.3) (2026-01-02)

### [1.24.2](https://github.com/xavisavvy/toa-website/compare/v1.24.1...v1.24.2) (2026-01-02)


### Bug Fixes

* resolve Replit production errors (trust proxy + rate limiter) ([1d192e4](https://github.com/xavisavvy/toa-website/commit/1d192e4354a7df9e85c2b08c95372aac576c4ce1))

### [1.24.1](https://github.com/xavisavvy/toa-website/compare/v1.24.0...v1.24.1) (2026-01-02)

## [1.24.0](https://github.com/xavisavvy/toa-website/compare/v1.23.0...v1.24.0) (2026-01-02)


### Features

* integrate YouTube channel videos in frontend ([b8048f0](https://github.com/xavisavvy/toa-website/commit/b8048f0b42e21ff706ed26911676f646146a452a)), closes [#1](https://github.com/xavisavvy/toa-website/issues/1)

## [1.23.0](https://github.com/xavisavvy/toa-website/compare/v1.22.12...v1.23.0) (2026-01-02)


### Features

* add YouTube channel videos API endpoint ([3a26b9f](https://github.com/xavisavvy/toa-website/commit/3a26b9f79635c8e5a9799b9acd2c4e899f21523c)), closes [#1](https://github.com/xavisavvy/toa-website/issues/1)

### [1.22.13](https://github.com/xavisavvy/toa-website/compare/v1.22.12...v1.22.13) (2026-01-01)

### [1.22.12](https://github.com/xavisavvy/toa-website/compare/v1.22.11...v1.22.12) (2026-01-01)

### [1.22.11](https://github.com/xavisavvy/toa-website/compare/v1.22.10...v1.22.11) (2026-01-01)


### Performance Improvements

* optimize CI build time with caching and parallel execution ([bf2a0f9](https://github.com/xavisavvy/toa-website/commit/bf2a0f91b8006ac2f1ccc4d5049577c588f73734))

### [1.22.10](https://github.com/xavisavvy/toa-website/compare/v1.22.9...v1.22.10) (2026-01-01)

### [1.22.9](https://github.com/xavisavvy/toa-website/compare/v1.22.8...v1.22.9) (2026-01-01)

### [1.22.8](https://github.com/xavisavvy/toa-website/compare/v1.22.7...v1.22.8) (2026-01-01)

### [1.22.7](https://github.com/xavisavvy/toa-website/compare/v1.22.6...v1.22.7) (2026-01-01)

### [1.22.6](https://github.com/xavisavvy/toa-website/compare/v1.22.5...v1.22.6) (2026-01-01)


### Bug Fixes

* remove version pinning for Alpine packages in Dockerfile ([484c36e](https://github.com/xavisavvy/toa-website/commit/484c36e1b00d759d3de168cd07845ebeef52cd66))

### [1.22.5](https://github.com/xavisavvy/toa-website/compare/v1.22.4...v1.22.5) (2026-01-01)

### [1.22.4](https://github.com/xavisavvy/toa-website/compare/v1.22.3...v1.22.4) (2026-01-01)


### Bug Fixes

* resolve tmp vulnerability (CVE) with package override ([184391f](https://github.com/xavisavvy/toa-website/commit/184391fd643cf3b45ca90b6db7ef77a4089f2816))

### [1.22.3](https://github.com/xavisavvy/toa-website/compare/v1.22.2...v1.22.3) (2026-01-01)

### [1.22.2](https://github.com/xavisavvy/toa-website/compare/v1.22.1...v1.22.2) (2026-01-01)

### [1.22.1](https://github.com/xavisavvy/toa-website/compare/v1.22.0...v1.22.1) (2026-01-01)

## [1.22.0](https://github.com/xavisavvy/toa-website/compare/v1.21.0...v1.22.0) (2026-01-01)


### Features

* add Lighthouse CI and enhanced ESLint configuration ([3f6ec0b](https://github.com/xavisavvy/toa-website/commit/3f6ec0b1d134cfef4af85f3773e73d38478a44ba))

## [1.21.0](https://github.com/xavisavvy/toa-website/compare/v1.20.0...v1.21.0) (2026-01-01)


### Features

* **cicd:** complete Phase 3 enterprise CI/CD implementation ([63091f8](https://github.com/xavisavvy/toa-website/commit/63091f8bfcae31fff57457218734f445273e09c2))

## [1.20.0](https://github.com/xavisavvy/toa-website/compare/v1.19.0...v1.20.0) (2026-01-01)


### Features

* Complete Phase 2 - Rate Limiting, Health Checks, and Automated Rollback ([db463f4](https://github.com/xavisavvy/toa-website/commit/db463f456915c025c526227d25f37a9fb9394929)), closes [#6](https://github.com/xavisavvy/toa-website/issues/6) [#15](https://github.com/xavisavvy/toa-website/issues/15) [#20](https://github.com/xavisavvy/toa-website/issues/20) [#15](https://github.com/xavisavvy/toa-website/issues/15) [#20](https://github.com/xavisavvy/toa-website/issues/20)

## [1.19.0](https://github.com/xavisavvy/toa-website/compare/v1.18.0...v1.19.0) (2026-01-01)


### Features

* Complete Phase 1 Enterprise CI/CD Implementation ([f6cb4f9](https://github.com/xavisavvy/toa-website/commit/f6cb4f902959824866799dfab7d5e16af75e834d))

## [1.18.0](https://github.com/xavisavvy/toa-website/compare/v1.17.0...v1.18.0) (2026-01-01)


### Features

* implement enterprise Docker image optimization ([5207a15](https://github.com/xavisavvy/toa-website/commit/5207a15424c214ed671971241cba4f8bf1f583d1)), closes [#10](https://github.com/xavisavvy/toa-website/issues/10)

## [1.17.0](https://github.com/xavisavvy/toa-website/compare/v1.16.4...v1.17.0) (2026-01-01)


### Features

* add comprehensive health check tests and update Docker healthcheck ([5c889f4](https://github.com/xavisavvy/toa-website/commit/5c889f484b44654d74978a443d7e3b12c9f1b555))

### [1.16.4](https://github.com/xavisavvy/toa-website/compare/v1.16.3...v1.16.4) (2026-01-01)

### [1.16.3](https://github.com/xavisavvy/toa-website/compare/v1.16.2...v1.16.3) (2026-01-01)

### [1.16.2](https://github.com/xavisavvy/toa-website/compare/v1.16.1...v1.16.2) (2026-01-01)

### [1.16.1](https://github.com/xavisavvy/toa-website/compare/v1.16.0...v1.16.1) (2026-01-01)

## [1.16.0](https://github.com/xavisavvy/toa-website/compare/v1.15.0...v1.16.0) (2026-01-01)


### Features

* Docker image optimization & Kubernetes deployment ([#7](https://github.com/xavisavvy/toa-website/issues/7)) ([717c8dc](https://github.com/xavisavvy/toa-website/commit/717c8dc48a998519e8892fc63f86cfd4f70f418a))

## [1.15.0](https://github.com/xavisavvy/toa-website/compare/v1.14.0...v1.15.0) (2026-01-01)


### Features

* implement enhanced health checks (Enterprise CI/CD [#13](https://github.com/xavisavvy/toa-website/issues/13)) ([1614001](https://github.com/xavisavvy/toa-website/commit/1614001737fd0e8b5d4842888c826ca09cc64bbe))

## [1.14.0](https://github.com/xavisavvy/toa-website/compare/v1.13.15...v1.14.0) (2026-01-01)


### Features

* add Replit automatic deployment integration ([36a98b9](https://github.com/xavisavvy/toa-website/commit/36a98b9276910524093d8ff298e4a638bffda500))

### [1.13.15](https://github.com/xavisavvy/toa-website/compare/v1.13.14...v1.13.15) (2026-01-01)

### [1.13.14](https://github.com/xavisavvy/toa-website/compare/v1.13.13...v1.13.14) (2026-01-01)


### Bug Fixes

* accessibility improvements - SVG icons, link contrast, mobile menu ([767d4e7](https://github.com/xavisavvy/toa-website/commit/767d4e7c8c2b9147a77a69ac60b5a5264f14c024))

### [1.13.13](https://github.com/xavisavvy/toa-website/compare/v1.13.12...v1.13.13) (2026-01-01)

### [1.13.12](https://github.com/xavisavvy/toa-website/compare/v1.13.11...v1.13.12) (2026-01-01)

### [1.13.11](https://github.com/xavisavvy/toa-website/compare/v1.13.10...v1.13.11) (2026-01-01)


### Bug Fixes

* property-based test for playlist ID validation ([50b5c5a](https://github.com/xavisavvy/toa-website/commit/50b5c5a88d310df17cd012609bdf5525c8582bc1))

### [1.13.10](https://github.com/xavisavvy/toa-website/compare/v1.13.9...v1.13.10) (2026-01-01)

### [1.13.9](https://github.com/xavisavvy/toa-website/compare/v1.13.8...v1.13.9) (2026-01-01)


### Bug Fixes

* remove SARIF generation from Trivy scanner ([10e1e9d](https://github.com/xavisavvy/toa-website/commit/10e1e9d58ae8bd1590c864a5f95f0499696abef4))

### [1.13.8](https://github.com/xavisavvy/toa-website/compare/v1.13.7...v1.13.8) (2026-01-01)


### Bug Fixes

* disable CodeQL scanning for free tier compatibility ([b03231f](https://github.com/xavisavvy/toa-website/commit/b03231fb6258d02b73737df184dee98a763c851b))

### [1.13.7](https://github.com/xavisavvy/toa-website/compare/v1.13.6...v1.13.7) (2026-01-01)


### Bug Fixes

* add Playwright browser installation to CI workflow ([4d98c28](https://github.com/xavisavvy/toa-website/commit/4d98c289bc010e59c03ce8ec448ebe6b8224366c))

### [1.13.6](https://github.com/xavisavvy/toa-website/compare/v1.13.5...v1.13.6) (2026-01-01)

### [1.13.5](https://github.com/xavisavvy/toa-website/compare/v1.13.4...v1.13.5) (2026-01-01)

### [1.13.4](https://github.com/xavisavvy/toa-website/compare/v1.13.3...v1.13.4) (2026-01-01)

### [1.13.3](https://github.com/xavisavvy/toa-website/compare/v1.13.2...v1.13.3) (2026-01-01)


### Bug Fixes

* adjust performance test thresholds for CI environment ([8751baf](https://github.com/xavisavvy/toa-website/commit/8751bafe24c64c2bd6b54cb809dc2567f3dcd3b2))

### [1.13.2](https://github.com/xavisavvy/toa-website/compare/v1.13.1...v1.13.2) (2026-01-01)


### Bug Fixes

* optimize deploy workflow and add deployment guide ([1d80a21](https://github.com/xavisavvy/toa-website/commit/1d80a2199139ed2a11bae3321c8eac8e09a4af73))

### [1.13.1](https://github.com/xavisavvy/toa-website/compare/v1.13.0...v1.13.1) (2026-01-01)


### Performance Improvements

* optimize build performance and add parallel builds ([b56368b](https://github.com/xavisavvy/toa-website/commit/b56368b944ecde6c7296c20d774abc1b431c6d88))

## [1.13.0](https://github.com/xavisavvy/toa-website/compare/v1.12.0...v1.13.0) (2026-01-01)


### Features

* enterprise security implementation and cleanup ([27853b1](https://github.com/xavisavvy/toa-website/commit/27853b14e0e8f12459f99e9e2191511023a1feca))

## [1.12.0](https://github.com/xavisavvy/toa-website/compare/v1.11.0...v1.12.0) (2026-01-01)


### Features

* **docker:** add production-ready Docker containerization ([756fd20](https://github.com/xavisavvy/toa-website/commit/756fd20ac8a72c428b3b7834ad308100194f5071))

## [1.11.0](https://github.com/xavisavvy/toa-website/compare/v1.10.1...v1.11.0) (2026-01-01)


### Features

* Add chaos and resilience testing infrastructure ([df88067](https://github.com/xavisavvy/toa-website/commit/df8806755339ef0303e21de76ed00106b592150a))
* Add comprehensive test reporting and observability ([efd7d95](https://github.com/xavisavvy/toa-website/commit/efd7d9597a91aa23076a0a55a8075641bc782829))

### [1.10.1](https://github.com/xavisavvy/toa-website/compare/v1.10.0...v1.10.1) (2026-01-01)

## [1.10.0](https://github.com/xavisavvy/toa-website/compare/v1.9.0...v1.10.0) (2026-01-01)


### Features

* implement contract testing and load testing infrastructure ([bf093b9](https://github.com/xavisavvy/toa-website/commit/bf093b9740fee318f0d956e2dfbb1f11023163be))

## [1.9.0](https://github.com/xavisavvy/toa-website/compare/v1.8.3...v1.9.0) (2025-12-31)


### Features

* implement agentic SDLC improvements - CI/CD, observability, and metrics ([abd0917](https://github.com/xavisavvy/toa-website/commit/abd09175ce5241e642198fc0d4450ac9ae62fa1c))

### [1.8.3](https://github.com/xavisavvy/toa-website/compare/v1.8.2...v1.8.3) (2025-12-31)


### Bug Fixes

* resolve test suite failures and improve validator robustness ([7865858](https://github.com/xavisavvy/toa-website/commit/78658585fdb0625a84f5806a79caf1f7ed73a7a4))

### [1.8.2](https://github.com/xavisavvy/toa-website/compare/v1.8.1...v1.8.2) (2025-12-31)


### Code Refactoring

* remove Vercel deployment configuration ([d63d84e](https://github.com/xavisavvy/toa-website/commit/d63d84ecf76fed9f4d1ce49c9391973bd15f2cd5))

### [1.8.1](https://github.com/xavisavvy/toa-website/compare/v1.8.0...v1.8.1) (2025-12-31)

## [1.8.0](https://github.com/xavisavvy/toa-website/compare/v1.7.0...v1.8.0) (2025-12-31)


### Features

* add load and stress testing ([#8](https://github.com/xavisavvy/toa-website/issues/8)) ([7d631c1](https://github.com/xavisavvy/toa-website/commit/7d631c1995288c7c77e1b8f121a61b31630be548))

## [1.7.0](https://github.com/xavisavvy/toa-website/compare/v1.6.1...v1.7.0) (2025-12-31)


### Features

* add visual regression testing ([#7](https://github.com/xavisavvy/toa-website/issues/7)) ([2af5190](https://github.com/xavisavvy/toa-website/commit/2af51901ea55a8878235dc4e4fb5185a7ebb18e4))

### [1.6.1](https://github.com/xavisavvy/toa-website/compare/v1.6.0...v1.6.1) (2025-12-31)

## [1.6.0](https://github.com/xavisavvy/toa-website/compare/v1.5.1...v1.6.0) (2025-12-31)


### Features

* add mutation testing infrastructure ([#6](https://github.com/xavisavvy/toa-website/issues/6)) ([ed46c17](https://github.com/xavisavvy/toa-website/commit/ed46c179972a3f7e1d4383209628a1f745b1eb7f))
* add mutation testing infrastructure ([#6](https://github.com/xavisavvy/toa-website/issues/6)) ([31cbf56](https://github.com/xavisavvy/toa-website/commit/31cbf56560682d329980818587f8668c93ab9f30))

### [1.5.1](https://github.com/xavisavvy/toa-website/compare/v1.5.0...v1.5.1) (2025-12-31)

## [1.5.0](https://github.com/xavisavvy/toa-website/compare/v1.4.1...v1.5.0) (2025-12-31)


### Features

* add comprehensive security testing suite ([#10](https://github.com/xavisavvy/toa-website/issues/10)) ([f64297a](https://github.com/xavisavvy/toa-website/commit/f64297aeb2ea52d795b8d76fb13f0a1f79c007a1))

### [1.4.1](https://github.com/xavisavvy/toa-website/compare/v1.4.0...v1.4.1) (2025-12-31)

## [1.4.0](https://github.com/xavisavvy/toa-website/compare/v1.3.1...v1.4.0) (2025-12-31)


### Features

* add performance and accessibility tests ([#5](https://github.com/xavisavvy/toa-website/issues/5) & [#9](https://github.com/xavisavvy/toa-website/issues/9)) ([f6da96b](https://github.com/xavisavvy/toa-website/commit/f6da96b70ea2b59ed39728a29ad4864af347f6aa))

### [1.3.1](https://github.com/xavisavvy/toa-website/compare/v1.3.0...v1.3.1) (2025-12-31)

## [1.3.0](https://github.com/xavisavvy/toa-website/compare/v1.2.0...v1.3.0) (2025-12-31)


### Features

* add snapshot and property-based tests ([#3](https://github.com/xavisavvy/toa-website/issues/3) & [#4](https://github.com/xavisavvy/toa-website/issues/4)) ([ac64c70](https://github.com/xavisavvy/toa-website/commit/ac64c705a81475ec41e40712f6d8fce5aad6135a))

## [1.2.0](https://github.com/xavisavvy/toa-website/compare/v1.1.11...v1.2.0) (2025-12-31)


### Features

* add contract tests with MSW and implementation guide ([#2](https://github.com/xavisavvy/toa-website/issues/2)) ([5862589](https://github.com/xavisavvy/toa-website/commit/586258981e0a13010df5b1edb92218a717a8151c)), closes [#1](https://github.com/xavisavvy/toa-website/issues/1) [#3](https://github.com/xavisavvy/toa-website/issues/3) [#4](https://github.com/xavisavvy/toa-website/issues/4) [#5](https://github.com/xavisavvy/toa-website/issues/5)
* add E2E tests with Playwright ([#1](https://github.com/xavisavvy/toa-website/issues/1)) ([17cfae7](https://github.com/xavisavvy/toa-website/commit/17cfae7843abca51f23c3aede6fa63fb6f49128b))

### [1.1.11](https://github.com/xavisavvy/toa-website/compare/v1.1.10...v1.1.11) (2025-12-31)

### [1.1.10](https://github.com/xavisavvy/toa-website/compare/v1.1.9...v1.1.10) (2025-12-31)

### [1.1.9](https://github.com/xavisavvy/toa-website/compare/v1.1.8...v1.1.9) (2025-12-31)


### Bug Fixes

* support multiple playlist caching and secure production logging ([6fa89b8](https://github.com/xavisavvy/toa-website/commit/6fa89b80149c8ba4da8fa2e80a1e269923cb116b))

### [1.1.8](https://github.com/xavisavvy/toa-website/compare/v1.1.7...v1.1.8) (2025-12-31)

### [1.1.7](https://github.com/xavisavvy/toa-website/compare/v1.1.6...v1.1.7) (2025-12-31)


### Bug Fixes

* add caching to podcast and etsy APIs to prevent 429 rate limit errors ([36ad518](https://github.com/xavisavvy/toa-website/commit/36ad5182938ee6ff17d4ad72cdeb8e2162424158))

### [1.1.6](https://github.com/xavisavvy/toa-website/compare/v1.1.5...v1.1.6) (2025-12-31)

### [1.1.5](https://github.com/xavisavvy/toa-website/compare/v1.1.4...v1.1.5) (2025-12-31)


### Bug Fixes

* fetch all YouTube playlist videos instead of limiting to 50 ([f7a93b7](https://github.com/xavisavvy/toa-website/commit/f7a93b73197fffca84d400ee6f2cc5d84918f48a))

### [1.1.4](https://github.com/xavisavvy/toa-website/compare/v1.1.3...v1.1.4) (2025-12-31)

### [1.1.3](https://github.com/xavisavvy/toa-website/compare/v1.1.2...v1.1.3) (2025-12-31)

### [1.1.2](https://github.com/xavisavvy/toa-website/compare/v1.1.1...v1.1.2) (2025-12-31)


### Bug Fixes

* Fixed an issue with footer navigation when on sub-pages ([1005a4f](https://github.com/xavisavvy/toa-website/commit/1005a4fc7806e8d5a15b1b1a5a9f3cf2738ca970))

### [1.1.1](https://github.com/xavisavvy/toa-website/compare/v1.1.0...v1.1.1) (2025-12-31)

## [1.1.0](https://github.com/xavisavvy/toa-website/compare/v1.0.1...v1.1.0) (2025-12-31)


### Features

* add automatic versioning with conventional commits ([52fcc90](https://github.com/xavisavvy/toa-website/commit/52fcc90a793623caea2f2fa778111cac857478ba))
* Adding new images for characters ([f4c1ca3](https://github.com/xavisavvy/toa-website/commit/f4c1ca33470b258c48889b8496ad58bb3126e71f))


### Bug Fixes

* add CSP worker-src directive and Vite startup logging ([3828c14](https://github.com/xavisavvy/toa-website/commit/3828c1476fc3f7f222dd4e94955f740cdae0af46))
* match gallery image aspect ratio to home screen ([f3da514](https://github.com/xavisavvy/toa-website/commit/f3da514627ad1a5a1128762c400d126a9a25b5c4))
* revert incorrect PostCSS config in vite.config.ts ([3a74180](https://github.com/xavisavvy/toa-website/commit/3a741803a2f494765b93feab98f222a91585a2d8))
* sort playlist videos by publish date in descending order ([1cb4f7a](https://github.com/xavisavvy/toa-website/commit/1cb4f7ac6f00f5e834b0e7e93b418fe506f7f0a6))
* update copyright from 'The Order of Azara' to 'Tales of Aneria' ([b5251c4](https://github.com/xavisavvy/toa-website/commit/b5251c493e39fb9e32b8b545330f8bcb1a3fd4ad))
* update footer hash links to work from all routes ([ba656f2](https://github.com/xavisavvy/toa-website/commit/ba656f2dbf67331d4c066d62e2dc2ede5cbab283))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
