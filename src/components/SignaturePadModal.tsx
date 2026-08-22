import React, { useRef, useState, useEffect } from "react";
import { PenTool, RotateCcw, Trash2, Check, Upload, Type, X } from "lucide-react";

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  signeeName: string;
  signeeTitle: string;
  onSaveSignature: (dataUrl: string) => void;
  currentSignature?: string;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  title,
  signeeName,
  signeeTitle,
  onSaveSignature,
  currentSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [activeTab, setActiveTab] = useState<"draw" | "type" | "upload">("draw");
  const [typedName, setTypedName] = useState(signeeName || "");
  const [selectedFont, setSelectedFont] = useState<"cursive" | "serif" | "script">("cursive");
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTypedName(signeeName || "");
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, signeeName]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a"; // deep slate
    ctx.lineWidth = 2.5;

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setStrokeHistory([]);

    if (currentSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = currentSignature;
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    // Save state for undo
    const rect = canvas.getBoundingClientRect();
    const snapshot = ctx.getImageData(0, 0, rect.width * 2, rect.height * 2);
    setStrokeHistory((prev) => [...prev.slice(-10), snapshot]);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setStrokeHistory([]);
  };

  const undoLastStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokeHistory.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lastState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setStrokeHistory((prev) => prev.slice(0, -1));
    if (strokeHistory.length <= 1) {
      setHasDrawn(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        onSaveSignature(event.target.result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTyped = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, 600, 200);

    ctx.fillStyle = "#0f172a";
    if (selectedFont === "cursive") {
      ctx.font = "italic 48px 'Brush Script MT', cursive, sans-serif";
    } else if (selectedFont === "script") {
      ctx.font = "italic 44px 'Segoe Script', cursive, sans-serif";
    } else {
      ctx.font = "italic 42px Georgia, serif";
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName || signeeName || "Authorized Signature", 300, 100);

    const dataUrl = canvas.toDataURL("image/png");
    onSaveSignature(dataUrl);
    onClose();
  };

  const handleSaveDrawn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSaveSignature(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="signature-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div
        id="signature-modal-card"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PenTool className="h-5 w-5 text-red-700" />
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Digital Signature • {signeeName || "Signatory"} ({signeeTitle || "Authority"})
            </p>
          </div>
          <button
            id="close-signature-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-6 pt-2">
          <button
            id="tab-draw-signature"
            onClick={() => setActiveTab("draw")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "draw"
                ? "border-red-700 text-red-800 bg-white rounded-t-lg"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <PenTool className="h-4 w-4" />
            Draw Signature
          </button>
          <button
            id="tab-type-signature"
            onClick={() => setActiveTab("type")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "type"
                ? "border-red-700 text-red-800 bg-white rounded-t-lg"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Type className="h-4 w-4" />
            Type Name
          </button>
          <button
            id="tab-upload-signature"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "upload"
                ? "border-red-700 text-red-800 bg-white rounded-t-lg"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {activeTab === "draw" && (
            <div className="space-y-3">
              <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-1">
                <canvas
                  id="signature-canvas"
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="h-48 w-full cursor-crosshair touch-none rounded-lg bg-white shadow-inner"
                />
                {!hasDrawn && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <PenTool className="h-7 w-7 mb-1 opacity-40" />
                    <span className="text-xs font-medium tracking-wide">Sign here with mouse, pen, or touch</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-4 border-b border-slate-300 w-11/12 text-slate-300 text-[10px] pointer-events-none pb-0.5">
                  Official Signature Line
                </div>
              </div>

              {/* Action Buttons for Drawing */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="undo-signature-btn"
                    onClick={undoLastStroke}
                    disabled={strokeHistory.length === 0}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Undo
                  </button>
                  <button
                    type="button"
                    id="clear-signature-btn"
                    onClick={clearCanvas}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  {signeeName ? `${signeeName}` : "Signatory"}
                </div>
              </div>
            </div>
          )}

          {activeTab === "type" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Signatory Full Name
                </label>
                <input
                  id="typed-signature-name-input"
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Enter full name to convert to signature"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Choose Script Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFont("cursive")}
                    className={`rounded-lg border p-3 text-center transition ${
                      selectedFont === "cursive"
                        ? "border-red-700 bg-red-50/50 text-red-900 font-semibold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="font-serif italic text-lg block">Script</span>
                    <span className="text-[10px] text-slate-500">Brush Style</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFont("script")}
                    className={`rounded-lg border p-3 text-center transition ${
                      selectedFont === "script"
                        ? "border-red-700 bg-red-50/50 text-red-900 font-semibold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="font-mono italic text-lg block">Calligraphy</span>
                    <span className="text-[10px] text-slate-500">Formal Flow</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFont("serif")}
                    className={`rounded-lg border p-3 text-center transition ${
                      selectedFont === "serif"
                        ? "border-red-700 bg-red-50/50 text-red-900 font-semibold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="font-serif italic text-lg block">Serif</span>
                    <span className="text-[10px] text-slate-500">Classic</span>
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-2">Signature Preview</p>
                <div
                  className={`text-3xl text-slate-900 py-2 ${
                    selectedFont === "cursive"
                      ? "font-serif italic tracking-wide"
                      : selectedFont === "script"
                      ? "font-mono italic"
                      : "font-serif italic"
                  }`}
                  style={{
                    fontFamily:
                      selectedFont === "cursive"
                        ? "'Brush Script MT', cursive, sans-serif"
                        : selectedFont === "script"
                        ? "'Segoe Script', cursive, sans-serif"
                        : "Georgia, serif",
                  }}
                >
                  {typedName || "Sample Signature"}
                </div>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-4 text-center">
              <label
                htmlFor="signature-upload-input"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 hover:bg-slate-100/80 cursor-pointer transition"
              >
                <Upload className="h-10 w-10 text-slate-400 mb-2" />
                <span className="text-sm font-semibold text-slate-700">Click to upload scanned signature</span>
                <span className="text-xs text-slate-500 mt-1">PNG, JPG, or SVG (transparent background recommended)</span>
                <input
                  id="signature-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            id="cancel-signature-modal-btn"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          {activeTab === "draw" && (
            <button
              type="button"
              id="apply-draw-signature-btn"
              onClick={handleSaveDrawn}
              disabled={!hasDrawn}
              className="flex items-center gap-2 rounded-lg bg-red-800 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-900 disabled:opacity-50 transition"
            >
              <Check className="h-4 w-4" />
              Apply Signature
            </button>
          )}

          {activeTab === "type" && (
            <button
              type="button"
              id="apply-typed-signature-btn"
              onClick={handleSaveTyped}
              disabled={!typedName.trim()}
              className="flex items-center gap-2 rounded-lg bg-red-800 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-900 disabled:opacity-50 transition"
            >
              <Check className="h-4 w-4" />
              Apply Typed Signature
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
