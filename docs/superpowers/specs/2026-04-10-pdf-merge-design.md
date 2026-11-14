# PDF Merge Tool Design

**Date:** 2026-04-10

## Overview

A single-file browser-based tool that lets the user select multiple PDFs, reorder them by dragging, and download a merged PDF. No server, no install, no upload.

## Architecture

- Single `index.html` file with inline CSS and JS
- `pdf-lib` loaded from CDN for PDF manipulation
- All processing happens locally in the browser

## UI Flow

1. "Choose files" button opens a multi-file picker
2. Selected files appear as a draggable vertical list (filename + drag handle per item)
3. User drags items to change merge order
4. "Merge and Download" button combines all PDFs in list order and downloads `merged.pdf`

## Merge Behavior

- All pages from file 1, then all pages from file 2, etc. (no page selection)
- `pdf-lib` copies pages into a new document and serializes to a Blob for download
- Order is exactly the visual order of the list at the time of merge

## Error Handling

- If a selected file is not a valid PDF, show an inline error message next to that file
- A bad file does not silently break the merge for other files
- File reading and merging wrapped to catch and surface errors clearly

## Out of Scope

- Selecting individual pages from a PDF
- Previewing PDF pages
- Rearranging pages across files
