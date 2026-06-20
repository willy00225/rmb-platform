"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function ExportPDFButton({ cardRef }: { cardRef: React.RefObject<HTMLDivElement> }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a6" }); // format carte de crédit
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save("carte-membre-rmb.pdf");
    } catch (err) {
      console.error("Erreur export PDF :", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={loading} variant="secondary" size="sm">
      {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
      <span className="ml-2">PDF</span>
    </Button>
  );
}