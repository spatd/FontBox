import type { StoredFont } from '../types'
const loadedFaces=new Map<string,FontFace>()
function familyKey(name:string){let hash=0;for(let i=0;i<name.length;i++)hash=((hash<<5)-hash+name.charCodeAt(i))|0;return`FontBox_${Math.abs(hash)}`}
export const fontFamilyFor=(font:StoredFont)=>familyKey(font.familyName||font.name)
export async function loadStoredFont(font:StoredFont){if(loadedFaces.has(font.id))return fontFamilyFor(font);const family=fontFamilyFor(font);const face=new FontFace(family,await font.blob.arrayBuffer(),{weight:String(font.weight||400),style:font.style||'normal'});await face.load();document.fonts.add(face);loadedFaces.set(font.id,face);return family}
export function unloadStoredFont(id:string){const face=loadedFaces.get(id);if(face)document.fonts.delete(face);loadedFaces.delete(id)}
