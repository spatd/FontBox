import type { StoredFont, TextStyle } from '../types'
import { canvasToBlob, renderTypography, saveBlob } from './textRenderer'
// EXPORT RESOLUTION: change this multiplier for larger or smaller PNG output.
export const EXPORT_SCALE=3
export async function exportFontPng(font:StoredFont,text:string,style:TextStyle){const canvas=await renderTypography(text,font,style,EXPORT_SCALE);const blob=await canvasToBlob(canvas);saveBlob(blob,`${(font.familyName||font.name).replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-fontbox.png`)}
