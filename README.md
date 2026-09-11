# FontBox

A local-only typography preview and PNG export PWA. Uploaded font files are stored in IndexedDB and never leave the device.

## Run locally

```bash
npm install
npm run dev
```

Use `npm run build` to create the offline-ready production build in `dist`.

## Customization

- App name and manifest: `vite.config.ts`
- Placeholder icons: `public/icons/`
- Light/dark theme colors: `src/styles.css`
- PNG export resolution: `EXPORT_SCALE` in `src/lib/pngExport.ts`

FontBox contains no bundled or external fonts, API calls, accounts, analytics, or backend services.
