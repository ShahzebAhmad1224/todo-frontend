// pages/DocEditor.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";

const DOC_STORAGE_KEY = "worknest_doc_editor";

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
const FONT_FAMILIES = ["Inter", "Georgia", "Times New Roman", "Courier New", "Arial", "Helvetica"];

const ToolBtn = ({ onClick, title, active, children, className = "" }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick && onClick(e); }}
    title={title}
    className={`px-2 py-1 rounded text-sm font-medium transition-all ${
      active
        ? "bg-indigo-600 text-white"
        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
    } ${className}`}
  >
    {children}
  </button>
);

export default function DocEditor() {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [docName, setDocName] = useState("Untitled Document");
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [textColor, setTextColor] = useState("#1e1e1e");
  const [bgHighlight, setBgHighlight] = useState("transparent");
  const [showExport, setShowExport] = useState(false);
  const [notification, setNotification] = useState("");

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  };

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DOC_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (editorRef.current) editorRef.current.innerHTML = data.content || "";
        setDocName(data.name || "Untitled Document");
        setLastSaved(data.savedAt || null);
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
      }));
      setLastSaved(now);
    } catch {}
  }, [docName]);

  useEffect(() => {
    const timer = setInterval(saveDoc, 10000);
    return () => clearInterval(timer);
  }, [saveDoc]);

  const updateWordCount = () => {
    const text = editorRef.current?.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  };

  const exec = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const applyFontSize = (size) => {
    setFontSize(size);
    exec("fontSize", "7");
    const fontEls = editorRef.current?.querySelectorAll('font[size="7"]');
    fontEls?.forEach((el) => {
      el.removeAttribute("size");
      el.style.fontSize = size + "px";
    });
  };

  const applyFontFamily = (family) => {
    setFontFamily(family);
    exec("fontName", family);
  };

  const insertTable = () => {
    const rows = parseInt(prompt("Number of rows:", "3") || "3");
    const cols = parseInt(prompt("Number of columns:", "3") || "3");
    if (!rows || !cols) return;
    let html = '<table border="1" style="border-collapse:collapse;width:100%;margin:8px 0"><tbody>';
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        html += `<td style="padding:6px 10px;border:1px solid #d1d5db;min-width:80px">&nbsp;</td>`;
      }
      html += "</tr>";
    }
    html += "</tbody></table><p><br></p>";
    exec("insertHTML", html);
  };

  const insertImage = () => {
    const url = prompt("Image URL (or leave blank to upload):");
    if (url) exec("insertImage", url);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  };

  // File upload (read text from .txt, show notice for others)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocName(file.name.replace(/\.[^/.]+$/, "") || "Uploaded Doc");

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (editorRef.current) {
          editorRef.current.innerHTML = ev.target.result
            .split("\n")
            .map((l) => `<p>${l || "<br>"}</p>`)
            .join("");
          updateWordCount();
          notify("Text file loaded!");
        }
      };
      reader.readAsText(file);
    } else if (ext === "html" || ext === "htm") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (editorRef.current) {
          // Extract body content only
          const parser = new DOMParser();
          const doc = parser.parseFromString(ev.target.result, "text/html");
          editorRef.current.innerHTML = doc.body?.innerHTML || ev.target.result;
          updateWordCount();
          notify("HTML file loaded!");
        }
      };
      reader.readAsText(file);
    } else {
      notify(`⚠️ ${ext.toUpperCase()} format detected — paste your content below to edit, then download.`);
    }
    e.target.value = "";
  };

  // Export functions
  const exportAs = (format) => {
    const content = editorRef.current?.innerHTML || "";
    const text = editorRef.current?.innerText || "";

    if (format === "html") {
      const full = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docName}</title>
<style>body{font-family:${fontFamily},sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}table{border-collapse:collapse}td{border:1px solid #ccc;padding:6px 10px}</style>
</head><body>${content}</body></html>`;
      download(new Blob([full], { type: "text/html" }), `${docName}.html`);

    } else if (format === "txt") {
      download(new Blob([text], { type: "text/plain" }), `${docName}.txt`);

    } else if (format === "md") {
      // Basic HTML→Markdown conversion
      let md = content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
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
      download(new Blob([md], { type: "text/markdown" }), `${docName}.md`);

    } else if (format === "pdf") {
      // Print-based PDF export
      const printWin = window.open("", "_blank");
      printWin.document.write(`<!DOCTYPE html><html><head><title>${docName}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: ${fontFamily}, sans-serif; font-size: ${fontSize}px; line-height: 1.7; color: #1e1e1e; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #ccc; padding: 6px 10px; }
</style></head><body>${content}</body></html>`);
      printWin.document.close();
      setTimeout(() => { printWin.print(); printWin.close(); }, 400);

    } else if (format === "rtf") {
      // Simple RTF
      const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 ${fontFamily};}}\n\\f0\\fs${fontSize * 2} ${text.replace(/\n/g, "\\par\n")}\n}`;
      download(new Blob([rtf], { type: "application/rtf" }), `${docName}.rtf`);
    }

    setShowExport(false);
    notify(`Exported as ${format.toUpperCase()}!`);
  };

  const download = (blob, name) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const queryState = (cmd) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      {/* Doc header bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-3">
        <input
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          className="flex-1 max-w-xs text-gray-800 dark:text-white bg-transparent font-semibold text-base outline-none border-b-2 border-transparent focus:border-indigo-400 transition-colors"
          placeholder="Document name..."
        />
        {lastSaved && (
          <span className="text-xs text-gray-400 dark:text-gray-500">Saved at {lastSaved}</span>
        )}
        <button onClick={saveDoc}
          className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition">
          💾 Save
        </button>
        <button onClick={() => fileInputRef.current.click()}
          className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition">
          📂 Open File
        </button>
        <div className="relative">
          <button onClick={() => setShowExport(!showExport)}
            className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-1 transition">
            ↓ Download ▾
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-50 min-w-36">
              {[
                { f: "pdf", label: "📄 PDF (Print)" },
                { f: "html", label: "🌐 HTML" },
                { f: "txt", label: "📝 Plain Text" },
                { f: "md", label: "✳ Markdown" },
                { f: "rtf", label: "📋 RTF (Word)" },
              ].map(({ f, label }) => (
                <button key={f} onClick={() => exportAs(f)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-1.5 flex items-center gap-1 flex-wrap">
        {/* Font family */}
        <select value={fontFamily} onChange={(e) => applyFontFamily(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 mr-1">
          {FONT_FAMILIES.map((f) => <option key={f}>{f}</option>)}
        </select>

        {/* Font size */}
        <select value={fontSize} onChange={(e) => applyFontSize(Number(e.target.value))}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 mr-2">
          {FONT_SIZES.map((s) => <option key={s}>{s}</option>)}
        </select>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        <ToolBtn onClick={() => exec("bold")} active={queryState("bold")} title="Bold (Ctrl+B)"><b>B</b></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} active={queryState("italic")} title="Italic (Ctrl+I)"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} active={queryState("underline")} title="Underline"><u>U</u></ToolBtn>
        <ToolBtn onClick={() => exec("strikeThrough")} title="Strikethrough"><s>S</s></ToolBtn>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        <ToolBtn onClick={() => exec("justifyLeft")} title="Align left">⬅</ToolBtn>
        <ToolBtn onClick={() => exec("justifyCenter")} title="Center">↔</ToolBtn>
        <ToolBtn onClick={() => exec("justifyRight")} title="Align right">➡</ToolBtn>
        <ToolBtn onClick={() => exec("justifyFull")} title="Justify">≡</ToolBtn>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet list">• List</ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered list">1. List</ToolBtn>
        <ToolBtn onClick={() => exec("indent")} title="Indent">→|</ToolBtn>
        <ToolBtn onClick={() => exec("outdent")} title="Outdent">|←</ToolBtn>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Headings */}
        {["h1", "h2", "h3"].map((h) => (
          <ToolBtn key={h} onClick={() => exec("formatBlock", h)} title={h.toUpperCase()}>
            <span style={{ fontSize: h === "h1" ? 14 : h === "h2" ? 12 : 11 }}>{h.toUpperCase()}</span>
          </ToolBtn>
        ))}
        <ToolBtn onClick={() => exec("formatBlock", "p")} title="Normal text">¶</ToolBtn>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        <ToolBtn onClick={insertTable} title="Insert table">⊞ Table</ToolBtn>
        <ToolBtn onClick={insertImage} title="Insert image">🖼</ToolBtn>
        <ToolBtn onClick={insertLink} title="Insert link">🔗</ToolBtn>
        <ToolBtn onClick={() => exec("insertHorizontalRule")} title="Horizontal line">― HR</ToolBtn>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Text color */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">A</span>
          <input type="color" value={textColor}
            onChange={(e) => { setTextColor(e.target.value); exec("foreColor", e.target.value); }}
            className="w-6 h-6 rounded border border-gray-200 cursor-pointer" title="Text color" />
        </div>

        {/* Highlight */}
        <div className="flex items-center gap-1 ml-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">HL</span>
          <input type="color" value={bgHighlight === "transparent" ? "#ffff00" : bgHighlight}
            onChange={(e) => { setBgHighlight(e.target.value); exec("hiliteColor", e.target.value); }}
            className="w-6 h-6 rounded border border-gray-200 cursor-pointer" title="Highlight color" />
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        <ToolBtn onClick={() => exec("undo")} title="Undo">↩</ToolBtn>
        <ToolBtn onClick={() => exec("redo")} title="Redo">↪</ToolBtn>
        <ToolBtn onClick={() => exec("removeFormat")} title="Clear formatting">✕ Format</ToolBtn>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-800 py-8 px-4">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={updateWordCount}
          style={{ fontFamily, fontSize }}
          className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 max-w-4xl mx-auto min-h-full p-12 shadow-lg rounded-sm outline-none leading-relaxed"
        />
      </div>

      {/* Status bar */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-1.5 flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
        <span>{wordCount} words</span>
        <span>{fontFamily} · {fontSize}px</span>
        <span className="ml-auto">Auto-saves every 10s · Ctrl+B Bold · Ctrl+I Italic</span>
      </div>

      {/* Notification toast */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl shadow-xl text-sm font-medium z-50 animate-pulse">
          {notification}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".txt,.html,.htm" className="hidden" onChange={handleFileUpload} />
    </div>
  );
}
