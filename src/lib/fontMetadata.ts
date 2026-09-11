import opentype from 'opentype.js'
import type { FontStyle,StoredFont } from '../types'

const METADATA_VERSION=2
const WEIGHTS:[RegExp,number,string][]=[[/\b(?:thin|hairline)\b/i,100,'Thin'],[/\b(?:extra\s*light|ultra\s*light|extralight|ultralight)\b/i,200,'ExtraLight'],[/\blight\b/i,300,'Light'],[/\b(?:book|regular|normal)\b/i,400,'Regular'],[/\bmedium\b/i,500,'Medium'],[/\b(?:semi\s*bold|demi\s*bold|semibold|demibold)\b/i,600,'SemiBold'],[/\b(?:extra\s*bold|ultra\s*bold|extrabold|ultrabold)\b/i,800,'ExtraBold'],[/\b(?:black|heavy)\b/i,900,'Black'],[/\bbold\b/i,700,'Bold']]
const TRAILING=/(?:[\s_-]+)(thin|hairline|extra\s*light|ultra\s*light|extralight|ultralight|light|book|regular|normal|medium|semi\s*bold|demi\s*bold|semibold|demibold|bold|extra\s*bold|ultra\s*bold|extrabold|ultrabold|black|heavy|italic|oblique)$/i
function pick(value:unknown){if(!value||typeof value!=='object')return;const n=value as Record<string,string>;return n.en||n['en-US']||Object.values(n).find(Boolean)}
function clean(value:string){return value.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim()}
export function inferWeight(value=''){for(const [pattern,weight] of WEIGHTS)if(pattern.test(clean(value)))return weight;return 400}
function weightLabel(weight:number){return WEIGHTS.find(([,w])=>w===weight)?.[2]||'Regular'}
export function normalizeFamilyName(raw:string){let value=clean(raw);let previous='';while(value!==previous){previous=value;value=value.replace(TRAILING,'').trim()}return value||clean(raw)}
function normalizeVariant(familyRaw:string,subfamilyRaw:string,fullRaw:string,osWeight?:number){const evidence=clean(`${familyRaw} ${subfamilyRaw} ${fullRaw}`);const style:FontStyle=/\b(?:italic|oblique)\b/i.test(evidence)?'italic':'normal';const fromName=inferWeight(`${familyRaw} ${subfamilyRaw}`);const weight=fromName!==400?fromName:(osWeight&&osWeight>=100?osWeight:inferWeight(fullRaw));let label=weightLabel(weight);if(weight===400&&style==='italic')label='Italic';else if(style==='italic')label+=` Italic`;return{weight,style,subfamilyName:label}}
function fallback(filename:string){const base=clean(filename.replace(/\.(ttf|otf|woff2?)$/i,''));const familyName=normalizeFamilyName(base);return{familyName,...normalizeVariant(base,base,base)}}

export async function readFontMetadata(file:Blob,filename:string):Promise<Pick<StoredFont,'familyName'|'subfamilyName'|'fullName'|'weight'|'style'|'metadataVersion'|'originalMetadata'>>{
 const fb=fallback(filename)
 try{const font=opentype.parse(await file.arrayBuffer());const names=font.names as unknown as Record<string,unknown>;const preferredFamily=pick(names.preferredFamily)||pick(names.typographicFamily);const family=pick(names.fontFamily);const preferredSubfamily=pick(names.preferredSubfamily)||pick(names.typographicSubfamily);const subfamily=pick(names.fontSubfamily);const fullName=pick(names.fullName);const familyRaw=preferredFamily||family||fb.familyName;const familyName=normalizeFamilyName(familyRaw);const variant=normalizeVariant(familyRaw,preferredSubfamily||subfamily||'',fullName||'',font.tables.os2?.usWeightClass);return{familyName,fullName:fullName||`${familyName} ${variant.subfamilyName}`,metadataVersion:METADATA_VERSION,...variant,originalMetadata:{preferredFamily,typographicFamily:pick(names.typographicFamily),family,preferredSubfamily,typographicSubfamily:pick(names.typographicSubfamily),subfamily,fullName,osWeight:font.tables.os2?.usWeightClass}}}
 catch{return{...fb,fullName:`${fb.familyName} ${fb.subfamilyName}`,metadataVersion:METADATA_VERSION,originalMetadata:{fileName:filename}}}
}
export async function enrichFont(font:StoredFont){if(font.metadataVersion===METADATA_VERSION)return font;return{...font,...await readFontMetadata(font.blob,font.filename)}}
