"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Download, ImageIcon, Loader2, Trash2, Upload, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SizeOption = "preview" | "auto" | "full";
type FormatOption = "png" | "jpg";
type TypeOption = "auto" | "product" | "person" | "car" | "graphic";

export default function BackgroundRemoverPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [credits, setCredits] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [size, setSize] = useState<SizeOption>("auto");
  const [format, setFormat] = useState<FormatOption>("png");
  const [type, setType] = useState<TypeOption>("auto");
  const [bgColor, setBgColor] = useState<string>("");

  const accept = useMemo(() => "image/png,image/jpeg,image/webp", []);

  const reset = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setResultBlob(null);
    setCredits(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [originalUrl, resultUrl]);

  const handleSelect = useCallback(
    (next: File | null | undefined) => {
      if (!next) return;
      if (!/^image\/(png|jpeg|webp)$/.test(next.type)) {
        setError("Please upload a PNG, JPG, or WEBP image.");
        return;
      }
      if (next.size > 12 * 1024 * 1024) {
        setError("Image must be under 12MB.");
        return;
      }
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setError(null);
      setResultUrl(null);
      setResultBlob(null);
      setCredits(null);
      setFile(next);
      setOriginalUrl(URL.createObjectURL(next));
    },
    [originalUrl, resultUrl]
  );

  const process = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      body.append("size", size);
      body.append("format", format);
      body.append("type", type);
      if (bgColor) body.append("bg_color", bgColor.replace("#", ""));

      const res = await fetch("/api/background-removal", { method: "POST", body });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const blob = await res.blob();
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setCredits(res.headers.get("X-Credits-Charged"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove background");
    } finally {
      setLoading(false);
    }
  }, [file, size, format, type, bgColor, resultUrl]);

  const download = useCallback(() => {
    if (!resultBlob || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const ext = format === "jpg" ? "jpg" : "png";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(resultBlob);
    a.download = `${base}-nobg.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, [resultBlob, file, format]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Background Remover
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Remove backgrounds from product shots, mockups, and customer artwork. Powered by remove.bg.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Controls */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure output before processing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Resolution</label>
                <Select value={size} onChange={(e) => setSize(e.target.value as SizeOption)}>
                  <option value="preview">Preview (0.25 MP, free)</option>
                  <option value="auto">Auto (up to 25 MP, 1 credit)</option>
                  <option value="full">Full (source size, 1+ credits)</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Subject Type</label>
                <Select value={type} onChange={(e) => setType(e.target.value as TypeOption)}>
                  <option value="auto">Auto-detect</option>
                  <option value="product">Product</option>
                  <option value="person">Person</option>
                  <option value="car">Car</option>
                  <option value="graphic">Graphic / Logo</option>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick &ldquo;Graphic&rdquo; for DTF artwork with crisp edges.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Format</label>
                <Select value={format} onChange={(e) => setFormat(e.target.value as FormatOption)}>
                  <option value="png">PNG (transparent)</option>
                  <option value="jpg">JPG (solid background)</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor || "#ffffff"}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    placeholder="#ffffff or leave blank"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave blank for transparent PNG output.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={process}
                  disabled={!file || loading}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Remove Background
                    </>
                  )}
                </button>

                <button
                  onClick={download}
                  disabled={!resultBlob}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors",
                    "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <Download className="h-4 w-4" />
                  Download Result
                </button>

                <button
                  onClick={reset}
                  disabled={!file && !resultUrl}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors",
                    "hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>
              </div>

              {credits && (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Credits charged: <span className="font-semibold text-foreground">{credits}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Preview area */}
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleSelect(e.dataTransfer.files?.[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex min-h-[360px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/60 hover:bg-muted/50"
                )}
              >
                <div className="rounded-full bg-primary/10 p-4 text-primary">
                  <Upload className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    Drop an image here, or click to browse
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    PNG, JPG, or WEBP — up to 12MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={(e) => handleSelect(e.target.files?.[0])}
                />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <PreviewCard title="Original" src={originalUrl} />
                <PreviewCard
                  title="Background Removed"
                  src={resultUrl}
                  transparent
                  placeholder={
                    loading ? (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm">Removing background…</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-sm">Click Remove Background</span>
                      </div>
                    )
                  }
                />
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tips for DTF artwork</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • Use <strong>Graphic / Logo</strong> subject type for flat artwork, logos, and
                  vectorized designs — it preserves hard edges better than Auto.
                </p>
                <p>
                  • Use <strong>Product</strong> for mockup photos of finished apparel.
                </p>
                <p>
                  • Choose <strong>Preview</strong> resolution while iterating — it&apos;s free. Switch
                  to Auto or Full for the production export.
                </p>
                <p>
                  • PNG output preserves transparency for DTF gang sheets. JPG bakes in the
                  background color you pick.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  src,
  transparent,
  placeholder,
}: {
  title: string;
  src: string | null;
  transparent?: boolean;
  placeholder?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className={cn(
            "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border",
            transparent ? "checkerboard" : "bg-muted"
          )}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={title}
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            placeholder
          )}
        </div>
      </CardContent>
    </Card>
  );
}
