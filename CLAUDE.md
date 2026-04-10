# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A browser-based PDF merge tool. Single-file HTML application — all HTML, CSS, and JS inline, no build step, no dependencies, open directly in a browser.

## Architecture

Single `index.html` — inline CSS and JS, no build step.

- **pdf-lib 1.17.1** loaded from `unpkg.com` CDN for PDF reading and writing
- **File API + FileReader** to read picked/dropped files as ArrayBuffers
- **HTML5 Drag and Drop API** for reordering the file list
- **Blob + URL.createObjectURL** to trigger the download

### State

One array `files` holds `{ file: File, error: string|null }` objects. All UI is re-rendered from this array on every change via `render()`.

## Running

Open `index.html` directly in a browser. No server needed.

## Developer Profile

Developer: Francisco Martinez Checa (GitHub: pacomc999) — beginner frontend developer.

## Coding Preferences

- No dashes (em dash, en dash) in visible UI text
- Clear variable names with comments explaining each section
- Short, single-purpose functions
- Small, incremental changes — ask before large structural changes
- Explain what changed and why after each edit
