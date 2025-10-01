import { useState } from "react";
import pdfToText from "react-pdftotext";

export default function PDFTest() {
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const extractText = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("📄 File selected:", file.name);
    console.log("📊 File size:", Math.round(file.size / 1024), "KB");
    console.log("📋 File type:", file.type);

    setLoading(true);
    setError("");
    setText("");

    try {
      console.log("🔄 Starting PDF text extraction...");
      const extractedText = await pdfToText(file);
      console.log("✅ Extraction successful!");
      console.log("📝 Text length:", extractedText.length);
      console.log("📝 First 300 chars:", extractedText.substring(0, 300));
      setText(extractedText);
    } catch (err) {
      console.error("❌ Extraction failed:", err);
      setError(err instanceof Error ? err.message : "Failed to extract text");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">PDF Text Extraction Test</h1>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select PDF File:
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={extractText}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
        />
      </div>

      {loading && (
        <div className="p-4 mb-4 bg-blue-100 text-blue-800 rounded">
          ⏳ Extracting text from PDF...
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-800 rounded">
          ❌ Error: {error}
        </div>
      )}

      {text && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Extracted Text:</h2>
          <div className="bg-white p-4 rounded border border-gray-300">
            <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {text}
            </p>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Total characters: {text.length}
          </p>
        </div>
      )}

      {!text && !loading && !error && (
        <div className="p-4 bg-gray-100 text-gray-600 rounded text-center">
          No PDF selected yet. Upload a PDF to see extracted text.
        </div>
      )}
    </div>
  );
}
