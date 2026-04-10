let pendingFiles: File[] = []
let pendingUrls: string[] = []

export function setPendingFiles(files: File[]) {
  pendingFiles = files
}

export function getAndClearPendingFiles(): File[] {
  const files = pendingFiles
  pendingFiles = []
  return files
}

export function setPendingUrls(urls: string[]) {
  pendingUrls = urls
}

export function getAndClearPendingUrls(): string[] {
  const urls = pendingUrls
  pendingUrls = []
  return urls
}
