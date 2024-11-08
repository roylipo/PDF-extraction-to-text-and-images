import { PDFWorker } from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

if (typeof window !== 'undefined' && !window.pdfjsWorker) {
  window.pdfjsWorker = new PDFWorker();
}

export const getWorker = () => {
  if (typeof window === 'undefined') return null;
  return window.pdfjsWorker;
};