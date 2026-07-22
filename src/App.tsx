import { useCallback, useEffect, useRef, useState } from "react";
import { calculateFaceOffset } from "./autoCrop";
import { getComplianceChecks } from "./compliance";
import { encodeJpegToLimit, formatBytes } from "./exportPhoto";
import { mapPreviewPointToSource, paintMaskPoint, type MaskPatch, type MaskPoint, type MaskTool } from "./maskEditor";
import { pendingSpecs, photoSpecs } from "./specs";
import { analyzePhoto, type FaceBounds } from "./vision";

const backgrounds = ["#f8f9fb", "#dcecff", "#e8eef2"];

export default function App() {
  const [online, setOnline] = useState(navigator.onLine);
  const [specId, setSpecId] = useState(photoSpecs[0].id);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cutout, setCutout] = useState<HTMLCanvasElement | null>(null);
  const [face, setFace] = useState<FaceBounds | null>(null);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [maskTool, setMaskTool] = useState<MaskTool>("move");
  const [brushSize, setBrushSize] = useState(36);
  const [maskRevision, setMaskRevision] = useState(0);
  const [undoCount, setUndoCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [background, setBackground] = useState(backgrounds[0]);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [output, setOutput] = useState<Blob | null>(null);
  const [detectMessage, setDetectMessage] = useState("可手动拖动校正");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseMaskRef = useRef<ImageData | null>(null);
  const undoRef = useRef<MaskPatch[][]>([]);
  const strokeRef = useRef<MaskPatch[]>([]);
  const lastBrushPointRef = useRef<MaskPoint | null>(null);
  const brushingRef = useRef(false);
  const spec = photoSpecs.find((item) => item.id === specId)!;
  const backgroundRemovalAllowed = spec.allowBackgroundRemoval !== false;

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const prepareOutput = useCallback(async () => {
    if (!canvasRef.current || !image) return;
    setOutput(await encodeJpegToLimit(canvasRef.current, spec.maxBytes));
  }, [image, spec.maxBytes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = spec.widthPx;
    canvas.height = spec.heightPx;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!image) return;
    const source = backgroundRemovalAllowed && removeBackground && cutout ? cutout : image;
    const cover = Math.max(canvas.width / source.width, canvas.height / source.height);
    const scale = cover * zoom;
    const width = source.width * scale;
    const height = source.height * scale;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, (canvas.width - width) / 2 + offsetX, (canvas.height - height) / 2 + offsetY, width, height);
    const timer = window.setTimeout(() => void prepareOutput(), 120);
    return () => window.clearTimeout(timer);
  }, [background, backgroundRemovalAllowed, cutout, image, maskRevision, offsetX, offsetY, prepareOutput, removeBackground, spec, zoom]);

  function autoCenter(targetFace = face, targetImage = image) {
    if (!targetFace || !targetImage) { setDetectMessage("未识别到单人正面照，请手动调整"); return; }
    const offset = calculateFaceOffset(targetFace, targetImage.naturalWidth, targetImage.naturalHeight, spec.widthPx, spec.heightPx);
    setOffsetX(offset.x);
    setOffsetY(offset.y);
    setDetectMessage("已按人脸关键点居中，请确认头顶和下巴");
  }

  function openFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const next = new Image();
    next.onload = async () => {
      setImage(next); setZoom(1); setOffsetX(0); setOffsetY(0);
      setCutout(null); setFace(null); setOutput(null);
      setMaskTool("move"); setMaskRevision(0); setUndoCount(0);
      baseMaskRef.current = null; undoRef.current = [];
      setDetectMessage("正在本地抠图与识别人脸…");
      URL.revokeObjectURL(url);
      try {
        const result = await analyzePhoto(next);
        setCutout(result.cutout);
        baseMaskRef.current = result.cutout.getContext("2d")?.getImageData(0, 0, result.cutout.width, result.cutout.height) ?? null;
        setFace(result.face ?? null);
        if (result.face) {
          autoCenter(result.face, next);
        } else {
          setDetectMessage("抠图完成，未识别到单张人脸，请手动调整");
        }
      } catch {
        setRemoveBackground(false);
        setDetectMessage("智能处理不可用，已切换到手动模式");
      }
    };
    next.src = url;
  }

  function download() {
    if (!output) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(output);
    link.download = `visa-go-${spec.id}.jpg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const factor = spec.widthPx / event.currentTarget.clientWidth;
    setOffsetX((event.clientX - drag.x) * factor);
    setOffsetY((event.clientY - drag.y) * factor);
  }

  const brushEnabled = maskTool !== "move" && Boolean(cutout && image && backgroundRemovalAllowed && removeBackground);

  function brush(event: React.PointerEvent<HTMLDivElement>) {
    if (!brushEnabled || !cutout || !image) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const previewX = (event.clientX - rect.left) * spec.widthPx / rect.width;
    const previewY = (event.clientY - rect.top) * spec.heightPx / rect.height;
    const point = mapPreviewPointToSource(previewX, previewY, cutout.width, cutout.height, spec.widthPx, spec.heightPx, zoom, offsetX, offsetY);
    const scale = Math.max(spec.widthPx / cutout.width, spec.heightPx / cutout.height) * zoom;
    const radius = brushSize / scale;
    const previous = lastBrushPointRef.current ?? point;
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
    const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius * 0.45)));
    for (let step = 1; step <= steps; step += 1) {
      const current = {
        x: previous.x + (point.x - previous.x) * step / steps,
        y: previous.y + (point.y - previous.y) * step / steps,
      };
      const patch = paintMaskPoint(cutout, image, current, radius, maskTool);
      if (patch) strokeRef.current.push(patch);
    }
    lastBrushPointRef.current = point;
    setMaskRevision((revision) => revision + 1);
  }

  function startPointer(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    if (brushEnabled) {
      brushingRef.current = true;
      strokeRef.current = [];
      lastBrushPointRef.current = null;
      brush(event);
      return;
    }
    setDrag({ x: event.clientX - offsetX / (spec.widthPx / event.currentTarget.clientWidth), y: event.clientY - offsetY / (spec.widthPx / event.currentTarget.clientWidth) });
  }

  function continuePointer(event: React.PointerEvent<HTMLDivElement>) {
    if (brushingRef.current) brush(event); else move(event);
  }

  function endPointer() {
    setDrag(null);
    if (!brushingRef.current) return;
    brushingRef.current = false;
    lastBrushPointRef.current = null;
    if (strokeRef.current.length > 0) {
      undoRef.current = [...undoRef.current.slice(-9), strokeRef.current];
      setUndoCount(undoRef.current.length);
    }
    strokeRef.current = [];
  }

  function undoMask() {
    if (!cutout) return;
    const stroke = undoRef.current.pop();
    const context = cutout.getContext("2d");
    if (!stroke || !context) return;
    for (let index = stroke.length - 1; index >= 0; index -= 1) {
      const patch = stroke[index];
      context.putImageData(patch.image, patch.x, patch.y);
    }
    setUndoCount(undoRef.current.length);
    setMaskRevision((revision) => revision + 1);
  }

  function resetMask() {
    if (!cutout || !baseMaskRef.current) return;
    cutout.getContext("2d")?.putImageData(baseMaskRef.current, 0, 0);
    undoRef.current = [];
    setUndoCount(0);
    setMaskRevision((revision) => revision + 1);
  }

  const checks = image ? getComplianceChecks(spec, output?.size) : [];

  return <main>
    <header className="masthead"><a className="brand" href="#top" aria-label="Visa Go 首页"><span>VG</span> VISA GO</a><p><i className={`network ${online ? "online" : "offline"}`} />{online ? "在线 · 可安装" : "离线模式 · 本地可用"}</p></header>
    <section className="intro" id="top"><div><p className="eyebrow">LOCAL PHOTO DESK / 本地照片工作台</p><h1>把签证照，<br />裁到规则里面。</h1></div><p className="lede">选择申请项目，上传一张清晰正面照，在安全框内调整并导出。规则来自官方页面，照片不会离开你的设备。</p></section>
    <section className="workspace"><aside className="controls">
      <div className="step"><span>01</span><div><label htmlFor="spec">申请项目</label><select id="spec" value={specId} onChange={(event) => setSpecId(event.target.value)}>{photoSpecs.map((item) => <option key={item.id} value={item.id}>{item.country} · {item.name}</option>)}</select></div></div>
      <div className="spec-card"><div><strong>{spec.widthPx} × {spec.heightPx} px</strong><small>{spec.mode}</small></div><p>{spec.note}</p><a href={spec.source} target="_blank" rel="noreferrer">官方来源 ↗</a><small>核实于 {spec.verifiedAt}</small></div>
      <div className="step"><span>02</span><div><label htmlFor="file">选择正面照片</label><input id="file" type="file" accept="image/*" onChange={(event) => openFile(event.target.files?.[0])} /></div></div>
      <div className="step"><span>03</span><div className="range"><label htmlFor="zoom">缩放 <b>{zoom.toFixed(2)}×</b></label><input id="zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><button className="auto" disabled={!face} onClick={() => autoCenter()}>自动居中</button><small>{detectMessage}</small></div></div>
      <div className="backgrounds"><label className="cutout-toggle"><input type="checkbox" checked={backgroundRemovalAllowed && removeBackground} disabled={!cutout || !backgroundRemovalAllowed} onChange={(event) => setRemoveBackground(event.target.checked)} /> {backgroundRemovalAllowed ? "自动抠图" : "该规格禁止换背景"}</label><span>证件照底色</span>{backgrounds.map((color) => <button key={color} style={{ background: color }} aria-label={`底色 ${color}`} disabled={!backgroundRemovalAllowed} className={background === color ? "active" : ""} onClick={() => setBackground(color)} />)}</div>
      {cutout && backgroundRemovalAllowed && <div className="mask-editor"><div className="mask-title"><strong>蒙版修正</strong><small>最多撤销 10 步</small></div><div className="mask-tools" role="group" aria-label="蒙版工具"><button className={maskTool === "move" ? "active" : ""} onClick={() => setMaskTool("move")}>移动</button><button className={maskTool === "erase" ? "active" : ""} disabled={!removeBackground} onClick={() => setMaskTool("erase")}>擦除</button><button className={maskTool === "restore" ? "active" : ""} disabled={!removeBackground} onClick={() => setMaskTool("restore")}>恢复</button></div><label className="brush-size" htmlFor="brush-size">画笔大小 <b>{brushSize}px</b><input id="brush-size" type="range" min="8" max="100" step="2" value={brushSize} disabled={maskTool === "move" || !removeBackground} onChange={(event) => setBrushSize(Number(event.target.value))} /></label><div className="mask-actions"><button disabled={undoCount === 0} onClick={undoMask}>撤销 ({undoCount})</button><button onClick={resetMask}>重置蒙版</button></div></div>}
      {checks.length > 0 && <div className="report"><div className="report-head"><strong>导出检查</strong>{output && <span>{formatBytes(output.size)}</span>}</div>{checks.map((check) => <div className={`check ${check.status}`} key={check.label}><i>{check.status === "pass" ? "✓" : "!"}</i><p><b>{check.label}</b><small>{check.detail}</small></p></div>)}</div>}
      <button className="download" disabled={!output} onClick={download}>导出合规尺寸 JPEG <span>→</span></button><p className="privacy">浏览器本地处理。刷新页面后，照片即从页面内存中清除。</p>
    </aside><div className="stage"><div className={`canvas-shell ${brushEnabled ? `tool-${maskTool}` : "tool-move"}`} style={{ aspectRatio: `${spec.widthPx}/${spec.heightPx}` }} onPointerDown={startPointer} onPointerMove={continuePointer} onPointerUp={endPointer} onPointerCancel={endPointer}><canvas ref={canvasRef} />{!image && <div className="empty"><b>上传照片后在这里调整</b><span>支持 JPG、PNG 和手机照片</span></div>}<div className="guide"><i className="eyes" /><i className="chin" /><span>眼睛线</span></div></div><p className="stage-note">{brushEnabled ? `${maskTool === "erase" ? "擦除" : "恢复"}模式：在照片边缘涂抹修正蒙版。` : "拖动照片调整位置；自动检测只是初始建议，请人工确认构图。"}</p></div></section>
    <section className="pending"><div><p className="eyebrow">NEXT DESTINATIONS</p><h2>正在核验的模板</h2></div>{pendingSpecs.map((item) => <article key={item.country}><strong>{item.country}</strong><span>{item.detail}</span><em>待核验</em></article>)}</section>
    <footer><span>VISA GO / 0.8</span><p>本工具不代表任何政府或签证机构，最终要求以申请页面为准。</p></footer>
  </main>;
}
