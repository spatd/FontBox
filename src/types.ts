export type StoredFont = {
  id: string
  name: string
  filename: string
  dateAdded: number
  favorite: boolean
  blob: Blob
}

export type ExportSettings = {
  size: number
  color: string
  alignment: CanvasTextAlign
  padding: number
  transparent: boolean
}
