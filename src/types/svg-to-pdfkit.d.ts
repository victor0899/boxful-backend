declare module 'svg-to-pdfkit' {
  import PDFDocument from 'pdfkit';

  function SVGtoPDF(
    doc: PDFDocument,
    svg: string,
    x: number,
    y: number,
    options?: {
      width?: number;
      height?: number;
      preserveAspectRatio?: string;
      useCSS?: boolean;
      fontCallback?: (family: string, bold: boolean, italic: boolean) => string;
      imageCallback?: (link: string) => string;
      warningCallback?: (message: string) => void;
      assumePt?: boolean;
      precision?: number;
    },
  ): void;

  export = SVGtoPDF;
}
