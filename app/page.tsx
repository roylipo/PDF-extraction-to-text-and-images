import { PDFProcessor } from '@/components/pdf-processor';

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            PDF Processor
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload your PDF to extract text, links, and generate page previews
          </p>
        </div>
        
        <PDFProcessor />
      </div>
    </main>
  );
}