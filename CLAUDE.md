# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PDF Toolbox: a browser-based tool to merge PDFs and make them smaller. Plain HTML, CSS and JS, no build step, open directly in a browser. Was called PDF Merger (repo `mergepdf`) until 2026-11-14.

## Architecture

`index.html` holds the page, its CSS and most of the JS inline; `compress.js` holds the compression.

- **pdf-lib 1.17.1** (MIT) kept locally in `vendor/pdf-lib.min.js`, so merging works offline
- **File API + FileReader** to read picked/dropped files as ArrayBuffers
- **HTML5 Drag and Drop API** for reordering the file list
- **Blob + URL.createObjectURL** to trigger the download
- **Compression** (`compress.js`, `compressImages(pdfDoc, level)`): finds every image XObject, decodes it (DCTDecode JPEGs via `createImageBitmap`; simple 8 bit FlateDecode RGB or grey via `DecompressionStream`), scales it to `COMPRESSION_LEVELS[level].longestSide` and re-encodes it as JPEG on a canvas, replacing it under the same reference only when smaller. Skips masks, Decode arrays, DecodeParms (predictors), CMYK, Indexed and tiny images. Text and fonts are never touched
- **Image size** choice: Original, Medium, Small. With one file Original is disabled (nothing to merge), so one file means compress

### State

One array `files` holds `{ file: File, error: string|null }` objects. All UI is re-rendered from this array on every change via `render()`.

### Web app

Installable web app, live at https://pacomc999.github.io/pdf_toolbox/ (repo pacomc999/pdf_toolbox, GitHub Pages from `master`, root).

- `manifest.webmanifest`: name, colours, icons (installing needs https, so only the live site installs)
- `icons/`: drawn by `tools/make_icons.py` (`python tools/make_icons.py`, needs Pillow)
- `sw.js`: network first service worker; bump `CACHE_NAME` and update `APP_FILES` when adding files

## Running

Open `index.html` directly in a browser. No server needed (offline support and installing only work on the live site).

## Developer Profile

Developer: Francisco Martinez Checa (GitHub: pacomc999) — beginner frontend developer.

## Coding Preferences

- No dashes (em dash, en dash) in visible UI text
- Clear variable names with comments explaining each section
- Short, single-purpose functions
- Small, incremental changes; ask before large structural changes
- Explain what changed and why after each edit
