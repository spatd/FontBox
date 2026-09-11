import type { StoredFont } from '../types'

const DB_NAME = 'fontbox-db'
const STORE = 'fonts'
const VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = run(tx.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export const getFonts = () => transact<StoredFont[]>('readonly', store => store.getAll())
export const saveFont = (font: StoredFont) => transact<IDBValidKey>('readwrite', store => store.put(font))
export const removeFont = (id: string) => transact<undefined>('readwrite', store => store.delete(id))
