import type { StoredFont } from '../types'

const loadedFaces = new Map<string, FontFace>()

export const fontFamilyFor = (id: string) => `FontBox-${id.replace(/[^a-zA-Z0-9-]/g, '')}`

export async function loadStoredFont(font: StoredFont) {
  if (loadedFaces.has(font.id)) return fontFamilyFor(font.id)
  const family = fontFamilyFor(font.id)
  const face = new FontFace(family, await font.blob.arrayBuffer())
  await face.load()
  document.fonts.add(face)
  loadedFaces.set(font.id, face)
  return family
}

export function unloadStoredFont(id: string) {
  const face = loadedFaces.get(id)
  if (face) document.fonts.delete(face)
  loadedFaces.delete(id)
}
