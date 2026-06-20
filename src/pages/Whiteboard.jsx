// pages/Whiteboard.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";

const STORAGE_KEY = "worknest_whiteboard";

const TOOLS = [
  { id: "select", icon: "↖", label: "Select" },
  { id: "pen", icon: "✏️", label: "Pen" },
  { id: "line", icon: "╱", label: "Line" },
  { id: "rect", icon: "▭", label: "Rectangle" },
  { id: "ellipse", icon: "◯", label: "Ellipse" },
  { id: "arrow", icon: "→", label: "Arrow" },
  { id: "text", icon: "T", label: "Text" },
  { id: "eraser", icon: "⬛", label: "Eraser" },
  { id: "image", icon: "🖼", label: "Image" },
];

const COLORS = ["#1e1e1e", "#e03131", "#2f9e44", "#1971c2", "#f08c00", "#ae3ec9", "#f783ac", "#ffffff"];
const STROKE_WIDTHS = [2, 4, 8, 16];

let elementId = 0;
const newId = () => ++elementId;

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  const [elements, setElements] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#1e1e1e");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [bgColor, setBgColor] = useState("white");
  const [drawing, setDrawing] = useState(false);
  const [current, setCurrent] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, value: "" });
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [images, setImages] = useState({});

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
    } catch {}
  }, [elements]);

  const pushHistory = (elems) => {
    setHistory((h) => [...h.slice(-50), elems]);
    setFuture([]);
  };

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [elements, ...f]);
      setElements(prev);
      return h.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setHistory((h) => [...h, elements]);
      setElements(next);
      return f.slice(1);
    });
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left - pan.x) / scale,
      y: (clientY - rect.top - pan.y) / scale,
    };
  };

  const draw = useCallback((ctx, elems, imgs) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    elems.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color || "#1e1e1e";
      ctx.fillStyle = el.color || "#1e1e1e";
      ctx.lineWidth = el.strokeWidth || 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (el.type === "pen") {
        if (!el.points || el.points.length < 2) return ctx.restore();
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        el.points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (el.type === "line") {
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
      } else if (el.type === "arrow") {
        const dx = el.x2 - el.x1, dy = el.y2 - el.y1;
        const angle = Math.atan2(dy, dx);
        const len = Math.sqrt(dx * dx + dy * dy);
        const headLen = Math.min(20, len * 0.3);
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(el.x2, el.y2);
        ctx.lineTo(el.x2 - headLen * Math.cos(angle - 0.4), el.y2 - headLen * Math.sin(angle - 0.4));
        ctx.lineTo(el.x2 - headLen * Math.cos(angle + 0.4), el.y2 - headLen * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
      } else if (el.type === "rect") {
        ctx.strokeRect(el.x, el.y, el.w, el.h);
      } else if (el.type === "ellipse") {
        ctx.beginPath();
        ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, Math.abs(el.w / 2), Math.abs(el.h / 2), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === "text") {
        ctx.font = `${el.fontSize || 18}px Inter, sans-serif`;
        ctx.fillStyle = el.color;
        ctx.fillText(el.text, el.x, el.y);
      } else if (el.type === "image") {
        const img = imgs[el.imgId];
        if (img) ctx.drawImage(img, el.x, el.y, el.w, el.h);
      } else if (el.type === "eraser") {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = el.strokeWidth * 3;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        el.points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.restore();
      }

      // Selection highlight
      if (el.id === selectedId) {
        ctx.save();
        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 1.5 / scale;
        ctx.setLineDash([5 / scale, 3 / scale]);
        const box = getBoundingBox(el);
        ctx.strokeRect(box.x - 6, box.y - 6, box.w + 12, box.h + 12);
        ctx.restore();
      }

      ctx.restore();
    });

    ctx.restore();
  }, [pan, scale, selectedId]);

  const getBoundingBox = (el) => {
    if (el.type === "pen" || el.type === "eraser") {
      const xs = el.points.map((p) => p.x), ys = el.points.map((p) => p.y);
      const minX = Math.min(...xs), minY = Math.min(...ys);
      return { x: minX, y: minY, w: Math.max(...xs) - minX || 10, h: Math.max(...ys) - minY || 10 };
    }
    if (el.type === "line" || el.type === "arrow") {
      return { x: Math.min(el.x1, el.x2), y: Math.min(el.y1, el.y2), w: Math.abs(el.x2 - el.x1) || 10, h: Math.abs(el.y2 - el.y1) || 10 };
    }
    if (el.type === "text") return { x: el.x, y: el.y - (el.fontSize || 18), w: 100, h: el.fontSize || 18 };
    return { x: el.x || 0, y: el.y || 0, w: el.w || 50, h: el.h || 50 };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    draw(ctx, elements, images);
  }, [elements, draw, images]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    const ctx = canvas.getContext("2d");
    draw(ctx, elements, images);
  }, [draw, elements, images]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const onMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    const pos = getPos(e);

    if (tool === "image") { fileInputRef.current.click(); return; }

    if (tool === "text") {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setTextInput({ visible: true, x: cx, y: cy, canvasX: pos.x, canvasY: pos.y, value: "" });
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    if (tool === "select") {
      const hit = [...elements].reverse().find((el) => {
        const box = getBoundingBox(el);
        return pos.x >= box.x - 10 && pos.x <= box.x + box.w + 10 &&
               pos.y >= box.y - 10 && pos.y <= box.y + box.h + 10;
      });
      setSelectedId(hit?.id || null);
      if (hit) setOffset({ x: pos.x - getBoundingBox(hit).x, y: pos.y - getBoundingBox(hit).y });
      setDrawing(!!hit);
      setCurrent(hit || null);
      return;
    }

    setDrawing(true);
    const base = { id: newId(), color, strokeWidth, type: tool };
    if (tool === "pen" || tool === "eraser") {
      setCurrent({ ...base, points: [pos] });
    } else if (tool === "line" || tool === "arrow") {
      setCurrent({ ...base, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    } else {
      setCurrent({ ...base, x: pos.x, y: pos.y, w: 0, h: 0 });
    }
  };

  const onMouseMove = (e) => {
    if (panning && panStart) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (!drawing || !current) return;
    const pos = getPos(e);

    if (tool === "select" && current) {
      const box = getBoundingBox(current);
      const dx = pos.x - offset.x - box.x;
      const dy = pos.y - offset.y - box.y;
      const moved = moveElement(current, dx, dy);
      setElements((prev) => prev.map((el) => el.id === current.id ? moved : el));
      setCurrent(moved);
    } else if (tool === "pen" || tool === "eraser") {
      const updated = { ...current, points: [...current.points, pos] };
      setCurrent(updated);
      const ctx = canvasRef.current.getContext("2d");
      draw(ctx, [...elements, updated], images);
    } else if (tool === "line" || tool === "arrow") {
      const updated = { ...current, x2: pos.x, y2: pos.y };
      setCurrent(updated);
      const ctx = canvasRef.current.getContext("2d");
      draw(ctx, [...elements, updated], images);
    } else {
      const updated = { ...current, w: pos.x - current.x, h: pos.y - current.y };
      setCurrent(updated);
      const ctx = canvasRef.current.getContext("2d");
      draw(ctx, [...elements, updated], images);
    }
  };

  const onMouseUp = () => {
    if (panning) { setPanning(false); setPanStart(null); return; }
    if (!drawing || !current || tool === "select" || tool === "text") { setDrawing(false); return; }
    pushHistory(elements);
    setElements((prev) => [...prev, current]);
    setCurrent(null);
    setDrawing(false);
  };

  const moveElement = (el, dx, dy) => {
    if (el.type === "pen" || el.type === "eraser") {
      return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    }
    if (el.type === "line" || el.type === "arrow") {
      return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
    }
    if (el.type === "text") return { ...el, x: el.x + dx, y: el.y + dy };
    return { ...el, x: el.x + dx, y: el.y + dy };
  };

  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((s) => Math.min(5, Math.max(0.1, s * factor)));
  };

  const onImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const imgId = `img_${Date.now()}`;
        setImages((prev) => ({ ...prev, [imgId]: img }));
        const canvas = canvasRef.current;
        const cx = (canvas.width / 2 - pan.x) / scale;
        const cy = (canvas.height / 2 - pan.y) / scale;
        const el = { id: newId(), type: "image", imgId, x: cx - 150, y: cy - 100, w: 300, h: 200, color };
        pushHistory(elements);
        setElements((prev) => [...prev, el]);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const commitText = () => {
    if (textInput.value.trim()) {
      pushHistory(elements);
      setElements((prev) => [...prev, {
        id: newId(), type: "text", x: textInput.canvasX, y: textInput.canvasY,
        text: textInput.value, color, fontSize: strokeWidth * 4 + 10, strokeWidth
      }]);
    }
    setTextInput({ visible: false, x: 0, y: 0, value: "" });
  };

  const clearCanvas = () => {
    if (window.confirm("Clear the entire whiteboard?")) {
      pushHistory(elements);
      setElements([]);
      setSelectedId(null);
    }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    pushHistory(elements);
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  const exportCanvas = (format) => {
    const canvas = document.createElement("canvas");
    const src = canvasRef.current;
    canvas.width = src.width;
    canvas.height = src.height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0);

    if (format === "png" || format === "jpg") {
      const mime = format === "jpg" ? "image/jpeg" : "image/png";
      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `worknest-whiteboard.${format}`;
        a.click();
      }, mime);
    } else if (format === "svg") {
      // Export current view as SVG using canvas data
      const dataURL = canvas.toDataURL("image/png");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
  <image href="${dataURL}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "worknest-whiteboard.svg";
      a.click();
    }
  };

  const resetView = () => { setPan({ x: 0, y: 0 }); setScale(1); };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-wrap shadow-sm">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTool(t.id);
                if (t.id === "image") fileInputRef.current.click();
              }}
              title={t.label}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                tool === t.id
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
              }`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ background: c, border: color === c ? "3px solid #6366f1" : "2px solid #d1d5db" }}
              className="w-6 h-6 rounded-full transition-transform hover:scale-110"
            />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border border-gray-300" title="Custom color" />
        </div>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Stroke width */}
        <div className="flex items-center gap-1">
          {STROKE_WIDTHS.map((w) => (
            <button key={w} onClick={() => setStrokeWidth(w)}
              style={{ width: w * 2 + 12, height: w * 2 + 12 }}
              className={`rounded-full transition-all ${
                strokeWidth === w ? "bg-indigo-600" : "bg-gray-400 dark:bg-gray-600 hover:bg-gray-500"
              }`}
            />
          ))}
        </div>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

        {/* BG Color */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">BG:</span>
          {["white", "#1e1e1e", "#f0f4ff", "#fff8f0"].map((c) => (
            <button key={c} onClick={() => setBgColor(c)}
              style={{ background: c, border: bgColor === c ? "2px solid #6366f1" : "2px solid #d1d5db" }}
              className="w-5 h-5 rounded"
            />
          ))}
        </div>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

        {/* History */}
        <button onClick={undo} title="Undo" className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">↩ Undo</button>
        <button onClick={redo} title="Redo" className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">↪ Redo</button>

        {selectedId && (
          <button onClick={deleteSelected} className="px-3 py-1.5 text-sm rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200">🗑 Delete</button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(scale * 100)}%</span>
          <button onClick={resetView} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">⊡ Reset View</button>
          <button onClick={clearCanvas} className="px-3 py-1.5 text-sm rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200">Clear</button>

          {/* Export */}
          <div className="relative group">
            <button className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1">
              ↓ Export ▾
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50 hidden group-hover:block min-w-28">
              {["png", "jpg", "svg"].map((f) => (
                <button key={f} onClick={() => exportCanvas(f)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 uppercase">
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden" style={{ background: bgColor }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          style={{ cursor: tool === "select" ? "default" : tool === "eraser" ? "cell" : "crosshair" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        />

        {/* Text input overlay */}
        {textInput.visible && (
          <input
            ref={textInputRef}
            value={textInput.value}
            onChange={(e) => setTextInput((t) => ({ ...t, value: e.target.value }))}
            onBlur={commitText}
            onKeyDown={(e) => { if (e.key === "Enter") commitText(); if (e.key === "Escape") setTextInput({ visible: false, x: 0, y: 0, value: "" }); }}
            style={{ position: "absolute", left: textInput.x, top: textInput.y, color, fontSize: strokeWidth * 4 + 10, background: "transparent", border: "1px dashed #6366f1", outline: "none", minWidth: 100 }}
            className="dark:text-white"
            placeholder="Type here..."
          />
        )}

        {/* Zoom hint */}
        <div className="absolute bottom-3 left-3 text-xs text-gray-400 dark:text-gray-600 pointer-events-none">
          Scroll to zoom • Alt+drag to pan
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
    </div>
  );
}
