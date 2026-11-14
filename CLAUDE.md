# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A browser-based PDF merge tool. Single-file HTML application — all HTML, CSS, and JS inline, no build step, no dependencies, open directly in a browser.

## Architecture

Single `index.html` — inline CSS and JS, no build step.

- **pdf-lib 1.17.1** (MIT) kept locally in `vendor/pdf-lib.min.js`, so merging works offline
- **File API + FileReader** to read picked/dropped files as ArrayBuffers
- **HTML5 Drag and Drop API** for reordering the file list
- **Blob + URL.createObjectURL** to trigger the download

### State

One array `files` holds `{ file: File, error: string|null }` objects. All UI is re-rendered from this array on every change via `render()`.

### Web app

Installable web app, live at https://pacomc999.github.io/mergepdf/ (GitHub Pages from `master`, root).

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
- Small, incremental changes — ask before large structural changes
- Explain what changed and why after each edit
