"use client";

import { useState, useRef, useCallback } from "react";
import { imagesApi, getImageDimensions } from "@/lib/api";
import { showAlert } from "@/components/AlertModal";

interface UploadFile { id: string; file: File; preview: string; status: "pending" | "uploading" | "success" | "error"; progress: number; }
interface BulkUploaderProps { eventId: string; onUploadComplete: () => void; onClose: () => void; }

export default function BulkUploader({ eventId, onUploadComplete, onClose }: BulkUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]); const [uploading, setUploading] = useState(false); const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null); const folderInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const MAX_SIZE = 20 * 1024 * 1024;
    let rejectedCount = 0;
    const imageFiles = Array.from(newFiles).filter((f) => {
      if (!f.type.startsWith("image/")) return false;
      if (f.size > MAX_SIZE) {
        rejectedCount++;
        return false;
      }
      return true;
    });
    if (rejectedCount > 0) {
      showAlert(`Skipped ${rejectedCount} file(s) that exceed the 20MB limit.`);
    }
    setFiles((prev) => [...prev, ...imageFiles.map((file) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, preview: URL.createObjectURL(file), status: "pending" as const, progress: 0 }))]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); };
  const removeFile = (id: string) => setFiles((prev) => { const f = prev.find((x) => x.id === id); if (f) URL.revokeObjectURL(f.preview); return prev.filter((x) => x.id !== id); });
  const clearAll = () => { files.forEach((f) => URL.revokeObjectURL(f.preview)); setFiles([]); };
  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => { const r = new FileReader(); r.readAsDataURL(file); r.onload = () => resolve(r.result as string); r.onerror = reject; });

  const uploadBase64WithProgress = (
    eventId: string,
    imgData: { url: string; key: string; width: number; height: number; size: number },
    onProgress: (prog: number) => void
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
        else reject(new Error('Upload failed'));
      });
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      xhr.open('POST', `${API_URL}/images/confirm`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      const token = localStorage.getItem('token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      xhr.send(JSON.stringify({ eventId, images: [imgData] }));
    });
  };

  const startUpload = async () => {
    if (!files.length || uploading) return;
    setUploading(true); setOverallProgress(0);
    const pending = files.filter((f) => f.status === "pending");
    if (!pending.length) { setUploading(false); return; }

    try {
      const progressMap = new Map<string, number>();
      const updateOverallProgress = () => {
         let totalProgress = 0;
         pending.forEach(uf => { totalProgress += progressMap.get(uf.id) || 0; });
         setOverallProgress(Math.round(totalProgress / pending.length));
      };

      for (let i = 0; i < pending.length; i += 2) {
        const batch = pending.slice(i, i + 2);
        
        await Promise.all(batch.map(async (uf) => {
          setFiles(p => p.map(f => f.id === uf.id ? { ...f, status: "uploading", progress: 0 } : f));
          progressMap.set(uf.id, 0);
          
          try {
            const base64Url = await fileToBase64(uf.file); 
            let dimensions = { width: 0, height: 0 }; 
            try { dimensions = await getImageDimensions(uf.file); } catch {}
            
            await uploadBase64WithProgress(eventId, {
              url: base64Url,
              key: uf.id,
              width: dimensions.width,
              height: dimensions.height,
              size: uf.file.size
            }, (prog) => {
              progressMap.set(uf.id, prog);
              updateOverallProgress();
              setFiles(p => p.map(f => f.id === uf.id ? { ...f, progress: prog } : f));
            });
            
            setFiles(p => p.map(f => f.id === uf.id ? { ...f, status: "success", progress: 100 } : f));
          } catch (err) {
            setFiles(p => p.map(f => f.id === uf.id ? { ...f, status: "error" } : f));
          }
        }));
      }
    } catch (err) {
      showAlert("Upload error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
    
    setUploading(false);
    onUploadComplete();
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720, maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Upload Photos</h2>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dim)", marginTop: 4 }}>Drag & drop or select files</p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={uploading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="modal-body" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {!uploading && (
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              style={{ border: "1px dashed var(--border2)", padding: "48px 32px", textAlign: "center", marginBottom: 24, background: "var(--bg3)", cursor: "pointer", transition: "border-color 0.2s" }}>
              <div style={{ fontSize: 36, opacity: 0.4, marginBottom: 12 }}>📸</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, color: "var(--cream)", marginBottom: 4 }}>Drop images here</p>
              <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 20 }}>PNG, JPG, HEIC up to 20MB each</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                <button className="btn-gold" style={{ padding: "10px 20px", fontSize: 10 }} onClick={() => fileInputRef.current?.click()}>Select Files</button>
                <button className="btn-outline" style={{ padding: "10px 20px", fontSize: 10 }} onClick={() => folderInputRef.current?.click()}>Select Folder</button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />
              <input ref={folderInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)} />
            </div>
          )}

          {uploading && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>Uploading…</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gold)" }}>{overallProgress}%</span>
              </div>
              <div style={{ height: 3, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, var(--gold), var(--gold2))", width: `${overallProgress}%`, transition: "width 0.3s" }} />
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>
                  {files.length} files
                  {successCount > 0 && <span style={{ color: "var(--green)", marginLeft: 8 }}>· {successCount} done</span>}
                  {errorCount > 0 && <span style={{ color: "var(--red)", marginLeft: 8 }}>· {errorCount} failed</span>}
                </span>
                {!uploading && <button style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)", background: "none", border: "none", cursor: "pointer" }} onClick={clearAll}>Clear</button>}
              </div>
              <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2 }}>
                {files.map((uf) => (
                  <div key={uf.id} style={{ aspectRatio: "1", overflow: "hidden", position: "relative", background: "var(--bg3)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uf.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {uf.status === "uploading" && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div className="spinner" style={{ width: 14, height: 14, marginBottom: 6 }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--gold)" }}>{uf.progress}%</span>
                      </div>
                    )}
                    {uf.status === "success" && <div style={{ position: "absolute", inset: 0, background: "rgba(122,171,126,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>}
                    {uf.status === "error" && <div style={{ position: "absolute", inset: 0, background: "rgba(212,102,74,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>}
                    {uf.status === "pending" && !uploading && (
                      <button onClick={() => removeFile(uf.id)} style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, background: "rgba(0,0,0,0.6)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0, transition: "opacity 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: 20 }}>
            <button className="btn-cancel" onClick={onClose} disabled={uploading}>{uploading ? "Uploading…" : "Cancel"}</button>
            <button className="btn-submit" onClick={startUpload} disabled={pendingCount === 0 || uploading}>
              {uploading ? `Uploading ${pendingCount}…` : `Upload ${pendingCount} Photos`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
