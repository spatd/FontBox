import { useEffect, useMemo, useRef, useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Download, Heart, Library, Moon, PenLine, Plus, Search, Settings, ShieldCheck, Sun, Trash2, Upload, X } from 'lucide-react'
import { getFonts, removeFont, saveFont } from './lib/fontStorage'
import { fontFamilyFor, loadStoredFont, unloadStoredFont } from './lib/fontLoader'
import { exportFontPng } from './lib/pngExport'
import type { ExportSettings, StoredFont } from './types'

type Tab = 'fonts' | 'editor' | 'settings'
const ACCEPTED = ['.ttf', '.otf', '.woff', '.woff2']
const DEFAULT_TEXT = 'Сәлем, әлем!\nBeautiful type.'
const DEFAULT_EXPORT: ExportSettings = { size: 144, color: '#111111', alignment: 'left', padding: 96, transparent: true }

function App() {
  const [fonts, setFonts] = useState<StoredFont[]>([])
  const [loaded, setLoaded] = useState<Set<string>>(new Set())
  const [text, setText] = useState(() => localStorage.getItem('fontbox-text') || DEFAULT_TEXT)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('fonts')
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => (localStorage.getItem('fontbox-theme') as 'system' | 'light' | 'dark') || 'system')
  const [exportFont, setExportFont] = useState<StoredFont | null>(null)
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT)
  const [notice, setNotice] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getFonts().then(async stored => {
      setFonts(stored)
      const results = await Promise.allSettled(stored.map(loadStoredFont))
      setLoaded(new Set(stored.filter((_, i) => results[i].status === 'fulfilled').map(font => font.id)))
    }).catch(() => showNotice('Could not open local font storage.'))
  }, [])

  useEffect(() => {
    localStorage.setItem('fontbox-text', text)
  }, [text])

  useEffect(() => {
    localStorage.setItem('fontbox-theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    void Promise.resolve(context.registerTool({
      name: 'set_preview_text',
      title: 'Set preview text',
      description: 'Set the text shown in every FontBox font preview.',
      inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const value = input as { text?: unknown }
        if (typeof value.text !== 'string') throw new Error('Text must be a string.')
        setText(value.text)
        setTab('editor')
        return { text: value.text, updated: true }
      },
    }, { signal: lifecycle.signal })).catch(() => undefined)
    return () => lifecycle.abort()
  }, [])

  const sortedFonts = useMemo(() => fonts
    .filter(font => font.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.dateAdded - a.dateAdded), [fonts, query])

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      if (!ACCEPTED.some(ext => file.name.toLowerCase().endsWith(ext))) {
        showNotice(`${file.name} is not a supported font.`)
        continue
      }
      const name = file.name.replace(/\.(ttf|otf|woff2?)$/i, '')
      const font: StoredFont = { id: crypto.randomUUID(), name, filename: file.name, dateAdded: Date.now(), favorite: false, blob: file }
      try {
        await loadStoredFont(font)
        await saveFont(font)
        setLoaded(current => new Set(current).add(font.id))
        setFonts(current => [...current, font])
        showNotice(`${name} added to FontBox.`)
      } catch {
        unloadStoredFont(font.id)
        showNotice(`${file.name} could not be loaded.`)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  async function updateFont(font: StoredFont, changes: Partial<StoredFont>) {
    const updated = { ...font, ...changes }
    await saveFont(updated)
    setFonts(current => current.map(item => item.id === updated.id ? updated : item))
  }

  async function deleteFont(font: StoredFont) {
    if (!window.confirm(`Delete “${font.name}”? The stored font file will be removed from this device.`)) return
    await removeFont(font.id)
    unloadStoredFont(font.id)
    setFonts(current => current.filter(item => item.id !== font.id))
    showNotice('Font deleted.')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">F</span><span>FontBox</span></div>
        <button className="icon-button" aria-label="Add fonts" onClick={() => inputRef.current?.click()}><Plus size={22} /></button>
        <input ref={inputRef} hidden type="file" multiple accept={ACCEPTED.join(',')} onChange={event => handleFiles(event.target.files)} />
      </header>

      <main>
        {tab === 'fonts' && <section className="view">
          <div className="headline-row"><div><p className="eyebrow">Your library</p><h1>{fonts.length} {fonts.length === 1 ? 'font' : 'fonts'}</h1></div><div className="local-badge"><ShieldCheck size={15} /> On device</div></div>
          {fonts.length > 0 && <label className="search"><Search size={19} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search fonts" aria-label="Search fonts" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={18} /></button>}</label>}
          {fonts.length === 0 ? <EmptyState onUpload={() => inputRef.current?.click()} /> : <div className="font-list">
            {sortedFonts.map(font => <FontCard key={font.id} font={font} text={text} loaded={loaded.has(font.id)} onFavorite={() => updateFont(font, { favorite: !font.favorite })} onRename={() => { const name = window.prompt('Font name', font.name)?.trim(); if (name) updateFont(font, { name }) }} onDelete={() => deleteFont(font)} onExport={() => setExportFont(font)} />)}
            {sortedFonts.length === 0 && <div className="empty-search">No fonts match “{query}”.</div>}
          </div>}
        </section>}

        {tab === 'editor' && <section className="view editor-view">
          <p className="eyebrow">Live specimen</p><h1>Preview text</h1>
          <textarea className="text-editor" value={text} onChange={e => setText(e.target.value)} aria-label="Preview text" placeholder="Type anything…" />
          <div className="editor-meta"><span>{text.length} characters</span><button onClick={() => setText(DEFAULT_TEXT)}>Reset sample</button></div>
          <h2>Quick preview</h2>
          {fonts.length ? <div className="font-list compact">{sortedFonts.slice(0, 4).map(font => <FontCard key={font.id} font={font} text={text} loaded={loaded.has(font.id)} onFavorite={() => updateFont(font, { favorite: !font.favorite })} onRename={() => {}} onDelete={() => {}} onExport={() => setExportFont(font)} compact />)}</div> : <button className="inline-upload" onClick={() => inputRef.current?.click()}><Upload size={18} /> Add a font to begin</button>}
        </section>}

        {tab === 'settings' && <section className="view settings-view">
          <p className="eyebrow">Preferences</p><h1>Settings</h1>
          <div className="settings-card"><div><h2>Appearance</h2><p>Choose how FontBox looks on this device.</p></div><div className="segmented">{(['system','light','dark'] as const).map(value => <button key={value} className={theme === value ? 'active' : ''} onClick={() => setTheme(value)}>{value === 'light' ? <Sun size={17}/> : value === 'dark' ? <Moon size={17}/> : null}{value[0].toUpperCase()+value.slice(1)}</button>)}</div></div>
          <div className="settings-card privacy"><ShieldCheck size={24}/><div><h2>Private by design</h2><p>Font files, favorites, and preview text stay in this browser. FontBox has no server, accounts, analytics, or external requests.</p></div></div>
          <div className="settings-card"><div><h2>Local library</h2><p>{fonts.length} uploaded {fonts.length === 1 ? 'font' : 'fonts'} stored in IndexedDB.</p></div><button className="secondary-button" onClick={() => inputRef.current?.click()}><Plus size={18}/> Add fonts</button></div>
        </section>}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <NavButton active={tab === 'fonts'} onClick={() => setTab('fonts')} icon={<Library />} label="Fonts" />
        <NavButton active={tab === 'editor'} onClick={() => setTab('editor')} icon={<PenLine />} label="Editor" />
        <NavButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={<Settings />} label="Settings" />
      </nav>
      {exportFont && <ExportSheet font={exportFont} text={text} settings={exportSettings} setSettings={setExportSettings} onClose={() => setExportFont(null)} onExport={async () => { await exportFontPng(exportFont, text, exportSettings); showNotice('PNG exported.'); }} />}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return <div className="empty-state"><div className="empty-glyph">Aa</div><h2>Build your font box</h2><p>Add TTF, OTF, WOFF, or WOFF2 files. They stay on this device and work offline.</p><button className="primary-button" onClick={onUpload}><Upload size={19}/> Choose font files</button></div>
}

type CardProps = { font: StoredFont; text: string; loaded: boolean; onFavorite: () => void; onRename: () => void; onDelete: () => void; onExport: () => void; compact?: boolean }
function FontCard({ font, text, loaded, onFavorite, onRename, onDelete, onExport, compact }: CardProps) {
  return <article className="font-card">
    <div className="card-header"><button className="font-name" onClick={compact ? undefined : onRename} title={compact ? undefined : 'Rename font'}>{font.name}</button><button className={`heart ${font.favorite ? 'active' : ''}`} onClick={onFavorite} aria-label={font.favorite ? 'Remove from favorites' : 'Add to favorites'}><Heart size={20} fill={font.favorite ? 'currentColor' : 'none'} /></button></div>
    <div className="preview-text" style={{ fontFamily: loaded ? `"${fontFamilyFor(font.id)}"` : 'inherit' }}>{loaded ? text || ' ' : 'Loading font…'}</div>
    <div className="card-footer"><span>{font.filename.split('.').pop()?.toUpperCase()} · {new Date(font.dateAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><div className="card-actions">{!compact && <button onClick={onDelete} aria-label={`Delete ${font.name}`}><Trash2 size={18}/></button>}<button className="export-button" onClick={onExport}><Download size={17}/> Export PNG</button></div></div>
  </article>
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button className={active ? 'active' : ''} onClick={onClick}>{icon}<span>{label}</span></button>
}

type SheetProps = { font: StoredFont; text: string; settings: ExportSettings; setSettings: (s: ExportSettings) => void; onClose: () => void; onExport: () => void }
function ExportSheet({ font, text, settings, setSettings, onClose, onExport }: SheetProps) {
  const patch = (value: Partial<ExportSettings>) => setSettings({ ...settings, ...value })
  return <div className="sheet-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="sheet" role="dialog" aria-modal="true" aria-label="Export PNG settings">
    <div className="sheet-handle"/><div className="sheet-title"><div><p className="eyebrow">Export PNG</p><h2>{font.name}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20}/></button></div>
    <div className="export-sample" style={{ fontFamily: `"${fontFamilyFor(font.id)}"`, color: settings.color, textAlign: settings.alignment }}>{text || 'Your text'}</div>
    <div className="control"><div><label htmlFor="size">Text size</label><output>{settings.size}px</output></div><input id="size" type="range" min="48" max="320" step="4" value={settings.size} onChange={e => patch({ size: Number(e.target.value) })}/></div>
    <div className="control"><div><label htmlFor="padding">Padding</label><output>{settings.padding}px</output></div><input id="padding" type="range" min="24" max="240" step="8" value={settings.padding} onChange={e => patch({ padding: Number(e.target.value) })}/></div>
    <div className="control-row"><div><label htmlFor="color">Text color</label><div className="color-input"><input id="color" type="color" value={settings.color} onChange={e => patch({ color: e.target.value })}/><span>{settings.color.toUpperCase()}</span></div></div><div><span className="control-label">Alignment</span><div className="align-buttons">{([['left',AlignLeft],['center',AlignCenter],['right',AlignRight]] as const).map(([value, Icon]) => <button key={value} className={settings.alignment === value ? 'active' : ''} onClick={() => patch({ alignment: value })} aria-label={`Align ${value}`}><Icon size={19}/></button>)}</div></div></div>
    <label className="toggle-row"><div><strong>Transparent background</strong><span>Best for layering in social apps</span></div><input type="checkbox" checked={settings.transparent} onChange={e => patch({ transparent: e.target.checked })}/></label>
    <button className="primary-button export-final" onClick={onExport}><Download size={19}/> Export high-resolution PNG</button>
  </section></div>
}

export default App
