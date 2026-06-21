// pages/DocEditor.jsx — Full-featured document editor
import React, { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";

const DOC_STORAGE_KEY = "worknest_doc_editor";
const FONT_SIZES = [8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const FONT_FAMILIES = ["Inter", "Arial", "Georgia", "Times New Roman", "Courier New", "Helvetica", "Verdana", "Trebuchet MS"];
const PAGE_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Light Gray", value: "#f3f4f6" },
  { label: "Cream", value: "#fefce8" },
  { label: "Light Blue", value: "#eff6ff" },
  { label: "Light Green", value: "#f0fdf4" },
  { label: "Light Pink", value: "#fdf2f8" },
  { label: "Lavender", value: "#f5f3ff" },
  { label: "Peach", value: "#fff7ed" },
];
const BORDER_STYLES = [
  { label: "None", value: "none" },
  { label: "Solid Thin", value: "1px solid #cbd5e1" },
  { label: "Solid Medium", value: "2px solid #64748b" },
  { label: "Solid Thick", value: "4px solid #1e293b" },
  { label: "Dashed", value: "2px dashed #94a3b8" },
  { label: "Dotted", value: "2px dotted #94a3b8" },
  { label: "Double", value: "4px double #475569" },
  { label: "Groove", value: "4px groove #94a3b8" },
];

const ToolBtn = ({ onClick, title, active, children, className = "", disabled = false }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick && onClick(e); }}
    title={title}
    disabled={disabled}
    className={`px-2 py-1 rounded text-sm font-medium transition-all select-none ${
      disabled ? "opacity-30 cursor-not-allowed" :
      active
        ? "bg-indigo-600 text-white shadow-sm"
        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
    } ${className}`}
  >
    {children}
  </button>
);

const Divider = () => <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />;

// Load external library via script tag
const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
  const s = document.createElement("script");
  s.src = src;
  s.onload = resolve;
  s.onerror = reject;
  document.head.appendChild(s);
});

export default function DocEditor() {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [docName, setDocName] = useState("Untitled Document");
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [textColor, setTextColor] = useState("#1e1e1e");
  const [bgHighlight, setBgHighlight] = useState("#ffff00");
  const [showExport, setShowExport] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [showPageOptions, setShowPageOptions] = useState(false);
  const [notification, setNotification] = useState("");
  const [notifType, setNotifType] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [hasDocument, setHasDocument] = useState(false);
  const [pageColor, setPageColor] = useState("#ffffff");
  const [pageBorder, setPageBorder] = useState("none");
  const [pageWidth, setPageWidth] = useState("max-w-4xl");
  const [docType, setDocType] = useState("new"); // new | txt | html | docx | pdf | pptx

  // Notify helper
  const notify = (msg, type = "info") => {
    setNotification(msg);
    setNotifType(type);
    setTimeout(() => setNotification(""), 3500);
  };

  // Load saved doc
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DOC_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (editorRef.current && data.content) {
          editorRef.current.innerHTML = data.content;
          setHasDocument(true);
        }
        if (data.name) setDocName(data.name);
        if (data.savedAt) setLastSaved(data.savedAt);
        if (data.pageColor) setPageColor(data.pageColor);
        if (data.pageBorder) setPageBorder(data.pageBorder);
      }
    } catch {}
  }, []);

  // Auto-save
  const saveDoc = useCallback(() => {
    if (!editorRef.current) return;
    const now = new Date().toLocaleTimeString();
    try {
      localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify({
        content: editorRef.current.innerHTML,
        name: docName,
        savedAt: now,
        pageColor,
        pageBorder,
      }));
      setLastSaved(now);
    } catch {}
  }, [docName, pageColor, pageBorder]);

  useEffect(() => {
    const timer = setInterval(saveDoc, 15000);
    return () => clearInterval(timer);
  }, [saveDoc]);

  // Word / char count
  const updateCounts = () => {
    const text = editorRef.current?.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    setCharCount(text.replace(/\s/g, "").length);
    setHasDocument(text.trim().length > 0 || (editorRef.current?.innerHTML || "").trim().length > 8);
  };

  const exec = (cmd, value = null) => {
    if (isReadOnly) return;
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const applyFontSize = (size) => {
    if (isReadOnly) return;
    setFontSize(size);
    exec("fontSize", "7");
    editorRef.current?.querySelectorAll('font[size="7"]').forEach((el) => {
      el.removeAttribute("size");
      el.style.fontSize = size + "px";
    });
  };

  const queryState = (cmd) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  // ── Insert helpers ──────────────────────────────────────
  const insertTable = () => {
    if (isReadOnly) return;
    const rows = parseInt(prompt("Number of rows:", "3") || "3");
    const cols = parseInt(prompt("Number of columns:", "3") || "3");
    if (!rows || !cols || rows > 20 || cols > 10) return notify("Invalid table size", "error");
    let html = '<table border="1" style="border-collapse:collapse;width:100%;margin:12px 0;table-layout:fixed"><tbody>';
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        html += `<td style="padding:8px 12px;border:1px solid #cbd5e1;min-width:80px;vertical-align:top">${r === 0 ? `<strong>Header ${c + 1}</strong>` : "&nbsp;"}</td>`;
      }
      html += "</tr>";
    }
    html += "</tbody></table><p><br></p>";
    exec("insertHTML", html);
  };

  const insertLink = () => {
    if (isReadOnly) return;
    const url = prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  };

  const insertHr = () => {
    if (isReadOnly) return;
    exec("insertHTML", "<hr style='border:none;border-top:2px solid #e2e8f0;margin:20px 0'/><p><br></p>");
  };

  const insertShape = (type) => {
    if (isReadOnly) return;
    setShowShapes(false);
    const shapes = {
      rect: `<div contenteditable="false" style="display:inline-block;width:150px;height:80px;background:#dbeafe;border:2px solid #3b82f6;border-radius:4px;margin:8px;vertical-align:middle"></div>`,
      roundrect: `<div contenteditable="false" style="display:inline-block;width:150px;height:80px;background:#dcfce7;border:2px solid #22c55e;border-radius:20px;margin:8px;vertical-align:middle"></div>`,
      circle: `<div contenteditable="false" style="display:inline-block;width:100px;height:100px;background:#fce7f3;border:2px solid #ec4899;border-radius:50%;margin:8px;vertical-align:middle"></div>`,
      diamond: `<div contenteditable="false" style="display:inline-block;width:100px;height:100px;background:#fef3c7;border:2px solid #f59e0b;transform:rotate(45deg);margin:20px;vertical-align:middle"></div>`,
      triangle: `<div contenteditable="false" style="display:inline-block;width:0;height:0;border-left:60px solid transparent;border-right:60px solid transparent;border-bottom:100px solid #a78bfa;margin:8px;vertical-align:middle"></div>`,
      arrow: `<div contenteditable="false" style="display:inline-flex;align-items:center;margin:8px;vertical-align:middle"><div style="width:100px;height:4px;background:#64748b"></div><div style="width:0;height:0;border-top:12px solid transparent;border-bottom:12px solid transparent;border-left:20px solid #64748b"></div></div>`,
      star: `<div contenteditable="false" style="display:inline-block;font-size:64px;color:#fbbf24;line-height:1;margin:8px;vertical-align:middle">★</div>`,
      callout: `<div contenteditable="false" style="display:inline-block;background:#eff6ff;border:2px solid #3b82f6;border-radius:12px;padding:12px 16px;margin:8px;position:relative;min-width:120px;vertical-align:middle"><div style="position:absolute;bottom:-18px;left:24px;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:18px solid #3b82f6"></div>Add text here</div>`,
      textbox: `<div contenteditable="true" style="display:inline-block;min-width:150px;min-height:60px;border:2px dashed #94a3b8;border-radius:4px;padding:8px;margin:8px;vertical-align:middle;background:#fafafa" data-placeholder="Text box...">Text box</div>`,
    };
    if (shapes[type]) exec("insertHTML", shapes[type] + "<p><br></p>");
  };

  const insertPageBreak = () => {
    if (isReadOnly) return;
    exec("insertHTML", "<div style='page-break-after:always;border-top:2px dashed #e2e8f0;margin:24px 0;text-align:center'><span style='background:white;padding:0 8px;color:#94a3b8;font-size:11px'>— Page Break —</span></div><p><br></p>");
  };

  // ── File upload ────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    const ext = file.name.split(".").pop().toLowerCase();
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setDocName(baseName || "Uploaded Document");

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (editorRef.current) {
          editorRef.current.innerHTML = ev.target.result
            .split("\n")
            .map((l) => `<p>${l || "<br>"}</p>`)
            .join("");
          updateCounts();
          setDocType("txt");
          setIsReadOnly(true);
          setHasDocument(true);
          notify("✅ Text file loaded! Click 'Edit Document' to make changes.", "success");
        }
      };
      reader.readAsText(file);

    } else if (ext === "html" || ext === "htm") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (editorRef.current) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(ev.target.result, "text/html");
          editorRef.current.innerHTML = doc.body?.innerHTML || ev.target.result;
          updateCounts();
          setDocType("html");
          setIsReadOnly(true);
          setHasDocument(true);
          notify("✅ HTML file loaded! Click 'Edit Document' to make changes.", "success");
        }
      };
      reader.readAsText(file);

    } else if (ext === "docx") {
      await loadDocx(file);

    } else if (ext === "pdf") {
      await loadPdf(file);

    } else if (ext === "pptx" || ext === "ppt") {
      await loadPptx(file);

    } else if (ext === "doc") {
      notify("⚠️ Legacy .doc format not supported. Please save as .docx and try again.", "warning");
    } else {
      notify(`⚠️ File type .${ext} is not supported. Supported: .txt, .html, .docx, .pdf, .pptx`, "warning");
    }
  };

  // Load .docx using mammoth via CDN
  const loadDocx = async (file) => {
    setIsLoading(true);
    setLoadingMsg("Loading Word document...");
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.convertToHtml({ arrayBuffer });
      if (editorRef.current) {
        // Apply better styling to the converted content
        let html = result.value;
        // Fix table styling
        html = html.replace(/<table>/g, '<table style="border-collapse:collapse;width:100%;margin:12px 0">');
        html = html.replace(/<td>/g, '<td style="border:1px solid #cbd5e1;padding:8px 12px">');
        html = html.replace(/<th>/g, '<th style="border:1px solid #cbd5e1;padding:8px 12px;background:#f8fafc;font-weight:600">');
        editorRef.current.innerHTML = html || "<p><em>Document appears empty or could not be parsed.</em></p>";
        updateCounts();
        setDocType("docx");
        setIsReadOnly(true);
        setHasDocument(true);
        if (result.messages.length) {
          notify("✅ Word document loaded! Some formatting may vary. Click 'Edit Document' to edit.", "success");
        } else {
          notify("✅ Word document loaded successfully! Click 'Edit Document' to make changes.", "success");
        }
      }
    } catch (err) {
      console.error(err);
      notify("❌ Failed to load Word document. Please try a different file.", "error");
    } finally {
      setIsLoading(false);
      setLoadingMsg("");
    }
  };

  // Load PDF using PDF.js via CDN (render as text)
  const loadPdf = async (file) => {
    setIsLoading(true);
    setLoadingMsg("Extracting PDF content... This may take a moment.");
    try {
      // Load PDF.js
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      let fullHtml = `<h1 style="font-size:22px;font-weight:700;color:#1e293b;margin-bottom:4px">${docName}</h1>
        <p style="color:#64748b;font-size:12px;margin-bottom:24px">Extracted from PDF · ${numPages} page${numPages > 1 ? "s" : ""}</p>`;

      for (let i = 1; i <= numPages; i++) {
        setLoadingMsg(`Extracting page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Group text items into lines
        const lines = [];
        let currentLine = [];
        let lastY = null;

        textContent.items.forEach((item) => {
          const y = Math.round(item.transform[5]);
          if (lastY !== null && Math.abs(y - lastY) > 3) {
            if (currentLine.length) lines.push(currentLine.join(" ").trim());
            currentLine = [];
          }
          if (item.str.trim()) currentLine.push(item.str);
          lastY = y;
        });
        if (currentLine.length) lines.push(currentLine.join(" ").trim());

        if (numPages > 1) {
          fullHtml += `<div style="border-top:2px solid #e2e8f0;margin:20px 0;padding-top:8px"><span style="color:#94a3b8;font-size:11px">— Page ${i} —</span></div>`;
        }

        lines.forEach((line) => {
          if (!line.trim()) return;
          const fs = line.length < 60 && /^[A-Z\d]/.test(line) ? "font-weight:600;" : "";
          fullHtml += `<p style="${fs}margin:4px 0">${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
        });
      }

      if (editorRef.current) {
        editorRef.current.innerHTML = fullHtml;
        updateCounts();
        setDocType("pdf");
        setIsReadOnly(true);
        setHasDocument(true);
        notify(`✅ PDF loaded (${numPages} pages). Click 'Edit Document' to edit the extracted text.`, "success");
      }
    } catch (err) {
      console.error(err);
      notify("❌ Failed to load PDF. The file may be encrypted or corrupted.", "error");
    } finally {
      setIsLoading(false);
      setLoadingMsg("");
    }
  };

  // Load PPTX using JSZip + basic XML parsing
  const loadPptx = async (file) => {
    setIsLoading(true);
    setLoadingMsg("Loading PowerPoint presentation...");
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");

      const arrayBuffer = await file.arrayBuffer();
      const zip = await window.JSZip.loadAsync(arrayBuffer);

      // Get list of slide files
      const slideFiles = Object.keys(zip.files)
        .filter((name) => /ppt\/slides\/slide\d+\.xml$/.test(name))
        .sort((a, b) => {
          const na = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
          const nb = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
          return na - nb;
        });

      if (slideFiles.length === 0) throw new Error("No slides found");

      let fullHtml = `<h1 style="font-size:22px;font-weight:700;color:#1e293b;margin-bottom:4px">${docName}</h1>
        <p style="color:#64748b;font-size:12px;margin-bottom:24px">PowerPoint Presentation · ${slideFiles.length} slide${slideFiles.length > 1 ? "s" : ""}</p>`;

      for (let idx = 0; idx < slideFiles.length; idx++) {
        setLoadingMsg(`Processing slide ${idx + 1} of ${slideFiles.length}...`);
        const xmlText = await zip.files[slideFiles[idx]].async("string");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Extract all text runs
        const paras = xmlDoc.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "p");
        const slideTexts = [];

        Array.from(paras).forEach((para) => {
          const runs = para.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "r");
          const lineText = Array.from(runs).map((r) => {
            const t = r.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "t")[0];
            return t?.textContent || "";
          }).join("");
          if (lineText.trim()) slideTexts.push(lineText.trim());
        });

        // Render slide
        fullHtml += `
          <div style="border:2px solid #e2e8f0;border-radius:12px;padding:24px;margin:16px 0;background:#fafafa;min-height:120px">
            <div style="font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">
              Slide ${idx + 1}
            </div>
            ${slideTexts.length === 0
              ? '<p style="color:#94a3b8;font-style:italic">Empty slide</p>'
              : slideTexts.map((t, i) => {
                  const isTitle = i === 0 && t.length < 120;
                  return isTitle
                    ? `<h2 style="font-size:18px;font-weight:700;color:#1e293b;margin:0 0 8px 0">${t}</h2>`
                    : `<p style="margin:4px 0;color:#374151">${t}</p>`;
                }).join("")}
          </div>`;
      }

      if (editorRef.current) {
        editorRef.current.innerHTML = fullHtml;
        updateCounts();
        setDocType("pptx");
        setIsReadOnly(true);
        setHasDocument(true);
        notify(`✅ PowerPoint loaded (${slideFiles.length} slides). Click 'Edit Document' to edit.`, "success");
      }
    } catch (err) {
      console.error(err);
      notify("❌ Failed to load PowerPoint file. The file may be corrupted.", "error");
    } finally {
      setIsLoading(false);
      setLoadingMsg("");
    }
  };

  // ── Export ─────────────────────────────────────────────
  const exportAs = async (format) => {
    setShowExport(false);
    const content = editorRef.current?.innerHTML || "";
    const text = editorRef.current?.innerText || "";

    if (format === "html") {
      const full = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docName}</title>
<style>
body{font-family:${fontFamily},sans-serif;max-width:860px;margin:40px auto;padding:32px;line-height:1.7;background:${pageColor};color:#1e293b}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd5e1;padding:8px 12px}
h1{font-size:28px}h2{font-size:22px}h3{font-size:18px}
</style></head><body>${content}</body></html>`;
      dlBlob(new Blob([full], { type: "text/html" }), `${docName}.html`);
      notify("✅ Exported as HTML!", "success");

    } else if (format === "txt") {
      dlBlob(new Blob([text], { type: "text/plain" }), `${docName}.txt`);
      notify("✅ Exported as Plain Text!", "success");

    } else if (format === "md") {
      let md = content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
        .replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_")
        .replace(/<i[^>]*>(.*?)<\/i>/gi, "_$1_")
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
        .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
      dlBlob(new Blob([md], { type: "text/markdown" }), `${docName}.md`);
      notify("✅ Exported as Markdown!", "success");

    } else if (format === "pdf") {
      const printWin = window.open("", "_blank");
      if (!printWin) { notify("❌ Pop-up blocked! Allow pop-ups to export PDF.", "error"); return; }
      printWin.document.write(`<!DOCTYPE html><html><head><title>${docName}</title>
<style>
@page{margin:2cm}
body{font-family:${fontFamily},sans-serif;font-size:${fontSize}px;line-height:1.7;color:#1e293b;background:${pageColor}}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd5e1;padding:8px 12px}
h1{font-size:26px}h2{font-size:20px}h3{font-size:16px}
img{max-width:100%}
</style></head><body>${content}</body></html>`);
      printWin.document.close();
      setTimeout(() => { printWin.print(); setTimeout(() => printWin.close(), 1000); }, 600);
      notify("🖨️ Print dialog opened — save as PDF!", "info");

    } else if (format === "docx") {
      // Export as RTF (opens in Word)
      const rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0
{\\fonttbl{\\f0\\fswiss\\fcharset0 ${fontFamily};}}
{\\colortbl ;\\red30\\green41\\blue59;}
\\f0\\fs${fontSize * 2}\\cf1
${text.replace(/\n/g, "\\par\n").replace(/[\\{}]/g, "\\$&")}
}`;
      dlBlob(new Blob([rtf], { type: "application/msword" }), `${docName}.rtf`);
      notify("✅ Exported as Word-compatible RTF!", "success");

    } else if (format === "rtf") {
      const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 ${fontFamily};}}\n\\f0\\fs${fontSize * 2} ${text.replace(/\n/g, "\\par\n")}\n}`;
      dlBlob(new Blob([rtf], { type: "application/rtf" }), `${docName}.rtf`);
      notify("✅ Exported as RTF!", "success");

    } else if (format === "pptx_html") {
      // Export as HTML slides
      const slides = content.split("<!-- slide -->").filter(Boolean);
      if (slides.length <= 1) {
        // Single slide export
        const html = `<!DOCTYPE html><html><head><title>${docName} - Slides</title>
<style>
body{margin:0;background:#1e293b;font-family:${fontFamily},sans-serif}
.slide{width:960px;min-height:540px;background:white;margin:40px auto;padding:60px;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.4);page-break-after:always}
</style></head><body><div class="slide">${content}</div></body></html>`;
        dlBlob(new Blob([html], { type: "text/html" }), `${docName}-slides.html`);
        notify("✅ Exported as Slide HTML!", "success");
      }
    }
  };

  const dlBlob = (blob, name) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const newDocument = () => {
    if (hasDocument && !confirm("Start a new document? Unsaved changes will be lost.")) return;
    if (editorRef.current) editorRef.current.innerHTML = "";
    setDocName("Untitled Document");
    setLastSaved(null);
    setWordCount(0); setCharCount(0);
    setIsReadOnly(false);
    setHasDocument(false);
    setDocType("new");
    setPageColor("#ffffff");
    setPageBorder("none");
    localStorage.removeItem(DOC_STORAGE_KEY);
    notify("📄 New document created.", "info");
  };

  const toggleEditMode = () => {
    setIsReadOnly((prev) => {
      const next = !prev;
      if (!next) {
        setTimeout(() => editorRef.current?.focus(), 100);
        notify("✏️ Edit mode enabled", "success");
      } else {
        notify("👁️ Read-only mode", "info");
      }
      return next;
    });
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-200" onClick={() => { setShowExport(false); setShowShapes(false); setShowPageOptions(false); }}>
      <Navbar />

      {/* ── Top action bar ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2 flex-wrap">
        {/* Doc name */}
        <input
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          disabled={isReadOnly}
          className="flex-1 min-w-0 max-w-xs text-gray-800 dark:text-white bg-transparent font-semibold text-sm outline-none border-b-2 border-transparent focus:border-indigo-400 transition-colors disabled:cursor-default"
          placeholder="Document name..."
        />
        {lastSaved && <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">Saved {lastSaved}</span>}

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <button onClick={newDocument} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition border border-gray-200 dark:border-gray-700">
            📄 New
          </button>

          <button
            onClick={() => fileInputRef.current.click()}
            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
          >
            📂 Open File
          </button>

          {/* Edit / Read toggle — only show when a doc is loaded */}
          {hasDocument && (
            <button
              onClick={toggleEditMode}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                isReadOnly
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isReadOnly ? "✏️ Edit Document" : "👁️ Read-Only"}
            </button>
          )}

          <button onClick={saveDoc} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition">
            💾 Save
          </button>

          {/* Download dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowExport(!showExport); setShowShapes(false); setShowPageOptions(false); }}
              className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-1 transition"
            >
              ⬇ Download ▾
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-1.5 z-50 min-w-48">
                <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Export As</div>
                {[
                  { f: "pdf", label: "📄 PDF (Print Dialog)" },
                  { f: "docx", label: "📝 Word (.rtf)" },
                  { f: "html", label: "🌐 HTML" },
                  { f: "md", label: "✳ Markdown" },
                  { f: "txt", label: "📋 Plain Text" },
                  { f: "rtf", label: "📄 RTF" },
                  { f: "pptx_html", label: "📊 Slide HTML" },
                ].map(({ f, label }) => (
                  <button key={f} onClick={() => exportAs(f)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Formatting toolbar ── */}
      <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 flex items-center gap-0.5 flex-wrap transition-opacity ${isReadOnly ? "opacity-50 pointer-events-none" : ""}`}>
        {/* Font family */}
        <select value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); exec("fontName", e.target.value); }}
          className="text-xs border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 mr-1">
          {FONT_FAMILIES.map((f) => <option key={f}>{f}</option>)}
        </select>

        {/* Font size */}
        <select value={fontSize} onChange={(e) => applyFontSize(Number(e.target.value))}
          className="text-xs border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 mr-1 w-16">
          {FONT_SIZES.map((s) => <option key={s}>{s}</option>)}
        </select>

        <Divider />
        <ToolBtn onClick={() => exec("bold")} active={queryState("bold")} title="Bold (Ctrl+B)"><b>B</b></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} active={queryState("italic")} title="Italic (Ctrl+I)"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} active={queryState("underline")} title="Underline"><u>U</u></ToolBtn>
        <ToolBtn onClick={() => exec("strikeThrough")} title="Strikethrough"><s>S</s></ToolBtn>
        <ToolBtn onClick={() => exec("superscript")} title="Superscript">x²</ToolBtn>
        <ToolBtn onClick={() => exec("subscript")} title="Subscript">x₂</ToolBtn>

        <Divider />
        <ToolBtn onClick={() => exec("justifyLeft")} title="Align Left">⬅</ToolBtn>
        <ToolBtn onClick={() => exec("justifyCenter")} title="Center">↔</ToolBtn>
        <ToolBtn onClick={() => exec("justifyRight")} title="Align Right">➡</ToolBtn>
        <ToolBtn onClick={() => exec("justifyFull")} title="Justify">≡</ToolBtn>

        <Divider />
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet List">• List</ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered List">1. List</ToolBtn>
        <ToolBtn onClick={() => exec("indent")} title="Indent">→|</ToolBtn>
        <ToolBtn onClick={() => exec("outdent")} title="Outdent">|←</ToolBtn>

        <Divider />
        {["h1","h2","h3"].map((h) => (
          <ToolBtn key={h} onClick={() => exec("formatBlock", h)} title={h.toUpperCase()}>
            <span style={{ fontSize: h === "h1" ? 13 : h === "h2" ? 11 : 10 }}>{h.toUpperCase()}</span>
          </ToolBtn>
        ))}
        <ToolBtn onClick={() => exec("formatBlock", "p")} title="Normal">¶</ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "blockquote")} title="Blockquote">❝</ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "pre")} title="Code Block">{`</>`}</ToolBtn>

        <Divider />
        <ToolBtn onClick={insertTable} title="Insert Table">⊞ Table</ToolBtn>
        <ToolBtn onClick={insertLink} title="Insert Link">🔗</ToolBtn>
        <ToolBtn onClick={insertHr} title="Horizontal Rule">― HR</ToolBtn>
        <ToolBtn onClick={insertPageBreak} title="Page Break">⊖ Break</ToolBtn>

        {/* Shapes dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <ToolBtn
            onClick={() => { setShowShapes(!showShapes); setShowExport(false); setShowPageOptions(false); }}
            title="Insert Shape"
          >
            ◻ Shape ▾
          </ToolBtn>
          {showShapes && (
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3 z-50 min-w-52">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Insert Shape</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "rect", label: "▬ Rectangle" },
                  { id: "roundrect", label: "▢ Rounded Rect" },
                  { id: "circle", label: "⬤ Circle/Oval" },
                  { id: "diamond", label: "◆ Diamond" },
                  { id: "triangle", label: "▲ Triangle" },
                  { id: "arrow", label: "→ Arrow" },
                  { id: "star", label: "★ Star" },
                  { id: "callout", label: "💬 Callout" },
                  { id: "textbox", label: "▭ Text Box" },
                ].map(({ id, label }) => (
                  <button key={id} onClick={() => insertShape(id)}
                    className="text-left text-xs px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />
        {/* Text color */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">A</span>
          <input type="color" value={textColor}
            onChange={(e) => { setTextColor(e.target.value); exec("foreColor", e.target.value); }}
            className="w-6 h-6 rounded border border-gray-200 cursor-pointer" title="Text Color" />
        </div>
        {/* Highlight */}
        <div className="flex items-center gap-1 ml-1">
          <span className="text-xs text-gray-500">HL</span>
          <input type="color" value={bgHighlight}
            onChange={(e) => { setBgHighlight(e.target.value); exec("hiliteColor", e.target.value); }}
            className="w-6 h-6 rounded border border-gray-200 cursor-pointer" title="Highlight Color" />
        </div>

        <Divider />
        <ToolBtn onClick={() => exec("undo")} title="Undo (Ctrl+Z)">↩</ToolBtn>
        <ToolBtn onClick={() => exec("redo")} title="Redo (Ctrl+Y)">↪</ToolBtn>
        <ToolBtn onClick={() => exec("removeFormat")} title="Clear Formatting">✕ Fmt</ToolBtn>
      </div>

      {/* ── Page options bar ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Page:</span>

        {/* Background color */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">BG</span>
          <div className="flex gap-1">
            {PAGE_COLORS.map((c) => (
              <button key={c.value} title={c.label}
                onClick={() => setPageColor(c.value)}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${pageColor === c.value ? "border-indigo-500 scale-110" : "border-gray-300"}`}
                style={{ background: c.value }}
              />
            ))}
            <input type="color" value={pageColor} onChange={(e) => setPageColor(e.target.value)}
              className="w-5 h-5 rounded border border-gray-200 cursor-pointer" title="Custom BG Color" />
          </div>
        </div>

        <Divider />
        {/* Border style */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Border</span>
          <select value={pageBorder} onChange={(e) => setPageBorder(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            {BORDER_STYLES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>

        <Divider />
        {/* Page width */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Width</span>
          <select value={pageWidth} onChange={(e) => setPageWidth(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            <option value="max-w-2xl">Narrow</option>
            <option value="max-w-4xl">Standard</option>
            <option value="max-w-5xl">Wide</option>
            <option value="max-w-full">Full Width</option>
          </select>
        </div>

        {/* Read-only badge */}
        {isReadOnly && (
          <div className="ml-auto flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg px-2.5 py-1">
            <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">👁️ Read-Only Mode</span>
            <button onClick={toggleEditMode} className="text-xs text-amber-700 dark:text-amber-300 underline hover:no-underline ml-1">Edit</button>
          </div>
        )}
      </div>

      {/* ── Editor area ── */}
      <div className="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-800 py-8 px-4">
        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-gray-700 dark:text-gray-300 font-medium text-center">{loadingMsg}</div>
              <div className="text-gray-400 text-sm">Please wait...</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasDocument && !isLoading && (
          <div className={`bg-white dark:bg-gray-950 ${pageWidth} mx-auto mb-4 p-12 rounded-sm shadow text-center`}>
            <div className="text-5xl mb-4">📄</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Your document is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Start typing below, or open a file to get started.<br />
              Supported formats: <strong>.txt, .html, .docx, .pdf, .pptx</strong>
            </p>
            <button onClick={() => fileInputRef.current.click()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition text-sm">
              📂 Open a Document
            </button>
          </div>
        )}

        {/* The document page */}
        <div
          ref={editorRef}
          contentEditable={!isReadOnly}
          suppressContentEditableWarning
          onInput={updateCounts}
          onClick={() => { setShowExport(false); setShowShapes(false); }}
          style={{
            fontFamily,
            fontSize: fontSize + "px",
            background: pageColor,
            border: pageBorder,
            lineHeight: "1.75",
            minHeight: "calc(100vh - 280px)",
          }}
          className={`${pageWidth} mx-auto p-12 shadow-lg rounded-sm outline-none text-gray-900 dark:text-gray-100 transition-all ${isReadOnly ? "cursor-default select-text" : "cursor-text"}`}
          data-placeholder="Start typing here..."
        />
      </div>

      {/* ── Status bar ── */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-1.5 flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
        <span>{wordCount} words · {charCount} chars</span>
        <span>{fontFamily} · {fontSize}px</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isReadOnly ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
          {isReadOnly ? "Read-Only" : "Editing"}
        </span>
        <span className="ml-auto hidden sm:block">Auto-saves every 15s · Ctrl+B Bold · Ctrl+I Italic · Ctrl+Z Undo</span>
      </div>

      {/* Notification toast */}
      {notification && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl shadow-2xl text-sm font-medium z-50 transition-all max-w-sm text-center ${
          notifType === "error" ? "bg-red-600 text-white" :
          notifType === "success" ? "bg-green-600 text-white" :
          notifType === "warning" ? "bg-amber-500 text-white" :
          "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
        }`}>
          {notification}
        </div>
      )}

      {/* Hidden file input — supports all doc types */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.html,.htm,.docx,.pdf,.pptx,.ppt"
        className="hidden"
        onChange={handleFileUpload}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        [contenteditable] table { border-collapse: collapse; }
        [contenteditable] td, [contenteditable] th { border: 1px solid #cbd5e1; padding: 6px 10px; }
        [contenteditable] blockquote { border-left: 4px solid #6366f1; margin: 12px 0; padding: 8px 16px; background: #f5f3ff; border-radius: 0 8px 8px 0; }
        [contenteditable] pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; font-family: 'Courier New', monospace; overflow-x: auto; }
        [contenteditable] img { max-width: 100%; border-radius: 4px; }
        [contenteditable] a { color: #6366f1; text-decoration: underline; }
      `}</style>
    </div>
  );
}
