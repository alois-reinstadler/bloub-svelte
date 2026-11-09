# Release preparation

This is an attributed Svelte 5 port of Jérémy Perret's Vue project `jeremy-prt/bloub`, with a deterministic SVG avatar engine, semantic controller, gaze behavior and a timeline/export editor. It is not full current upstream parity: the local README documents eight motion states and eleven expressions, while current upstream advertises fourteen states and sixteen expressions. Svelte lifecycle/controller additions do not erase that drift. At cached upstream b4bb3c1, missing catalog states are `exclaim`, `sleep`, `egg`, `hexagon`, `play`, and `comet`; `swirl` is an upstream interface transition outside the catalog. Missing rest-expression categories are excited, angry, proud, shy and bored (upstream `excite`, `colere`, `fier`, `timide`, `blase`). The retained categories use English IDs in this port.

The original MIT notice is retained unchanged. Upstream reference used for this review: cached commit b4bb3c1 plus the current upstream README/license checked on 2026-11-09; this is not an assertion that every local file descends from that one revision.

Visual identity review (including the inherited `docs/states.png` sheet): the silhouette and measured morphs intentionally recreate the x.ai/Grok-associated avatar. That image shows fourteen upstream poses and is not evidence that this port implements them; the eight-entry `STATES` array is the local catalog. The monochrome landing palette does not make that identity original. Code licensing does not establish permission for branding or the depicted design. Keep attribution and non-affiliation conspicuous; owner should choose an independently designed mascot or obtain appropriate clearance before public positioning. No endorsement is claimed.

The package has not been published to npm. Local checks do not certify every browser's GIF/MP4 export, reduced-motion behavior or SSR hydration; qualify a fresh packed consumer and the supported browser matrix before release.

## Owner checklist

- [ ] Select the exact source commit, version, package identity and archive hash.
- [ ] Resolve the limitations and inclusion decisions above.
- [ ] Run the repository gate on the final candidate and retain logs.
- [ ] Inspect packed exports, files, dependency closure and third-party notices.
- [ ] Verify public documentation and assets independently of local tests.
- [ ] Obtain separate publication approval; this preparation does not publish, tag or merge.
