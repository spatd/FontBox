export type FontStyle = 'normal' | 'italic'
export type StoredFont = { id:string; name:string; filename:string; dateAdded:number; favorite:boolean; blob:Blob; familyName?:string; subfamilyName?:string; fullName?:string; weight?:number; style?:FontStyle }
export type FontFamily = { id:string; familyName:string; variants:StoredFont[]; favorite:boolean }
export type MarkerStyle = { mode:'off'|'solid'|'rounded'|'underline'; color:string; opacity:number; paddingX:number; paddingY:number; radius:number }
export type ShadowStyle = { enabled:boolean; color:string; opacity:number; blur:number; x:number; y:number }
export type StrokeStyle = { enabled:boolean; color:string; width:number }
export type CaseMode = 'original'|'upper'|'lower'|'capitalize'
export type TextStyle = { fontSize:number; color:string; caseMode:CaseMode; marker:MarkerStyle; curve:number; stroke:StrokeStyle; shadow:ShadowStyle; letterSpacing:number; lineHeight:number; alignment:CanvasTextAlign; padding:number }
