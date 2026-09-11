import type { ExportSettings, StoredFont } from '../types'
import { fontFamilyFor, loadStoredFont } from './fontLoader'

// EXPORT RESOLUTION: change this multiplier for larger or smaller PNG output.
export const EXPORT_SCALE = 3

export async function exportFontPng(font: StoredFont, text: string, settings: ExportSettings) {
  await loadStoredFont(font)
  const family = fontFamilyFor(font.id)
  await document.fonts.load(`${settings.size}px "${family}"`)

  const probe = document.createElement('canvas').getContext('2d')!
  probe.font = `${settings.size}px "${family}"`
  const lines = (text || ' ').split('\n')
  const lineHeight = settings.size * 1.22
  const width = Math.ceil(Math.max(...lines.map(line => probe.measureText(line || ' ').width)) + settings.padding * 2)
  const height = Math.ceil(lines.length * lineHeight + settings.padding * 2)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width * EXPORT_SCALE)
  canvas.height = Math.max(1, height * EXPORT_SCALE)
  const ctx = canvas.getContext('2d')!
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE)
  if (!settings.transparent) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.font = `${settings.size}px "${family}"`
  ctx.fillStyle = settings.color
  ctx.textBaseline = 'top'
  ctx.textAlign = settings.alignment
  const x = settings.alignment === 'left' ? settings.padding : settings.alignment === 'right' ? width - settings.padding : width / 2
  lines.forEach((line, index) => ctx.fillText(line, x, settings.padding + index * lineHeight))
  const url = canvas.toDataURL('image/png')
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${font.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-fontbox.png`
  anchor.click()
}
