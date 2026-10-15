# Earth Odyssey · SKC Universe

## Adaptation and upstream code

This independent SKC / Seow Khang Chun presentation adapts [earth-migration by 玛卡巴卡 / oxomkbk](https://github.com/oxomkbk/earth-migration), based on upstream commit [`fc129932a990a45a4ca501aaeac74d4ff39ae089`](https://github.com/oxomkbk/earth-migration/tree/fc129932a990a45a4ca501aaeac74d4ff39ae089).

The SKC adaptation reorganizes the original two experiences into the main voyage (`index.html`) and The Origin (`classic.html`), adds SKC navigation and English/Chinese presentation, self-hosts the supplied font files, and adds an original procedural aurora treatment. The upstream camera/story system, scene assets, and rendering foundation remain credited to their authors. This is a modified version, not an official upstream release.

The upstream code is licensed under the MIT License, copyright (c) 2026 玛卡巴卡. The complete notice is preserved in [UPSTREAM-LICENSE.txt](UPSTREAM-LICENSE.txt). The original documentation and attribution record are retained in [UPSTREAM-README.md](UPSTREAM-README.md).

This is a fan work inspired by *The Wandering Earth*. It is not affiliated with or endorsed by its rights holders. Planetary scales, travel times, propulsion, colors, and camera movement are adapted for a cinematic experience; this is not a scientific flight simulator.

## Scene assets

The following attribution and license information is retained from the upstream project:

- **Stars and Milky Way:** NASA / Goddard Space Flight Center / Scientific Visualization Studio, [Deep Star Maps 2020](https://svs.gsfc.nasa.gov/4851/) using Gaia DR2, Hipparcos-2, and Tycho-2. The panorama and star catalogue derive from `milkyway_2020_4k.exr` and `hiptyc_2020_8k.exr`. Milky Way plan view: NASA Goddard / CI Lab (`assets/sky/milkyway_top_2k.jpg`). Identified by upstream as public-domain material.
- **Planet textures:** [Solar System Scope](https://www.solarsystemscope.com/textures/), licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/) (`assets/planets/`). The supplied maps are used as texture inputs to the project's rendered scenes; lighting, projection, and the final appearance are modified by the renderer. Pluto imagery is credited by upstream to NASA / JHUAPL / SwRI and identified there as public domain.
- **3D models:** [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources), International Space Station (B), Hubble Space Telescope (A), and Mobile Launcher. Identified by upstream as public domain; the provided project copies use compressed glTF assets. NASA does not endorse this project.
- **Surface materials:** [Poly Haven](https://polyhaven.com/), `metal_plate_02`, `painted_metal_shutter`, `gray_rocks`, `blue_metal_plate`, and `aerial_ground_rock`, under [CC0](https://polyhaven.com/license).
- **Earth and Moon textures:** three.js example textures, derived from NASA Blue Marble / Black Marble imagery, retained in `assets/earth/`. Source attribution is recorded in the upstream documentation. The scene also includes a procedural fallback planet.
- **Rendering library:** [three.js](https://threejs.org/), r160, copyright (c) 2010–2023 three.js authors, under the MIT License. The complete notice is retained in [vendor/three/LICENSE](vendor/three/LICENSE). The bundled Three.js add-ons and Draco decoder are retained with the upstream vendor files and notices.

NASA material is credited for its identified source, not as a blanket assertion that every item on a NASA website is free of third-party rights. The [NASA images and media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) apply to NASA material and identifiers.

## Fonts

The six local WOFF2 files were supplied by the upstream project's wallpaper font bundle. They are used without renaming or changing the font software. The complete SIL Open Font License 1.1 text and copyright notice for each family are supplied with this adaptation:

| Font | Copyright | Complete license | Official license source |
| --- | --- | --- | --- |
| Orbitron | 2018 The Orbitron Project Authors; Reserved Font Name: Orbitron | [Orbitron-OFL.txt](fonts/Orbitron-OFL.txt) | [Google Fonts](https://github.com/google/fonts/blob/main/ofl/orbitron/OFL.txt) |
| Rajdhani | 2014 Indian Type Foundry | [Rajdhani-OFL.txt](fonts/Rajdhani-OFL.txt) | [Google Fonts](https://github.com/google/fonts/blob/main/ofl/rajdhani/OFL.txt) |
| JetBrains Mono | 2020 The JetBrains Mono Project Authors | [JetBrainsMono-OFL.txt](fonts/JetBrainsMono-OFL.txt) | [Google Fonts](https://github.com/google/fonts/blob/main/ofl/jetbrainsmono/OFL.txt) |

These font licenses were retrieved from the official Google Fonts repository on 2026-10-15. Chinese glyphs use the visitor's available system font fallbacks.

## Aurora references and original treatment

The procedural aurora added for the SKC version is an original implementation informed by these primary sources:

- NASA Earth Observatory, [Cruising Past the Aurora Borealis](https://science.nasa.gov/earth/earth-observatory/cruising-past-the-aurora-borealis-147984/): ISS photograph acquired 2017-09-15 by Randy Bresnik / Expedition 53; article published 2021-02-27.
- NASA Earth Observatory, [Purple Haze Aurora](https://science.nasa.gov/earth/earth-observatory/purple-haze-aurora/): ISS photograph `ISS075-E-88592`, acquired 2026-09-07; ISS Crew Earth Observations Facility and Earth Science and Remote Sensing Unit, NASA Johnson Space Center.
- NASA Science, [Auroras](https://science.nasa.gov/sun/auroras/), for the relationship between atmospheric gases, altitude, and emitted colors.

These pages and photographs were consulted as visual and scientific references. The aurora photographs and videos are not bundled in this website, and no third-party aurora shader was copied. The stronger purple accents are an artistic SKC color treatment, not a quantitative model of auroral emissions.

## SKC aurora refinement · 2026-10-15

The V3.1 treatment expands the original procedural aurora into broader, softer green-violet curtains with stronger coherent flow. Earth surface lighting and local texture contrast are refined independently of the sky; an aurora-focused view preserves terrain and city detail. These are original SKC rendering changes, retaining the upstream attribution and existing source licenses. No new reference media or remote runtime dependency was added.
