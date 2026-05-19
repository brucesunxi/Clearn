export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()

  const pdfjsLib = await import('pdfjs-dist')

  const version = (pdfjsLib as any).version || '5.7.284'
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    for (const item of content.items) {
      if ('str' in item) {
        text += (item as { str: string }).str + ' '
      }
    }
    text += '\n\n'
  }

  return text.trim()
}
