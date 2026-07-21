import { useEffect, useRef, useState } from "react";
import { pendingSpecs, photoSpecs } from "./specs";

const backgrounds = ["#f8f9fb", "#dcecff", "#e8eef2"];

export default function App() {
  const [specId, setSpecId] = useState(photoSpecs[0].id);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [background, setBackground] = useState(backgrounds[0]);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spec = photoSpecs.find((item) => item.id === specId)!;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = spec.widthPx;
    canvas.height = spec.heightPx;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!image) return;
    const cover = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const scale = cover * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, (canvas.width - width) / 2 + offsetX, (canvas.height - height) / 2 + offsetY, width, height);
  }, [background, image, offsetX, offsetY, spec, zoom]);

  function openFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const next = new Image();
    next.onload = () => {
      setImage(next);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      URL.revokeObjectURL(url);
    };
    next.src = url;
  }

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `visa-go-${spec.id}.jpg`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, "image/jpeg", 0.92);
  }

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const factor = spec.widthPx / event.currentTarget.clientWidth;
    setOffsetX((event.clientX - drag.x) * factor);
    setOffsetY((event.clientY - drag.y) * factor);
  }

  return (
    <main>
      <header className="masthead">
        <a className="brand" href="#top" aria-label="Visa Go 首页"><span>VG</span> VISA GO</a>
        <p>照片留在本机 · 无需账户</p>
      </header>

      <section className="intro" id="top">
        <div><p className="eyebrow">LOCAL PHOTO DESK / 本地照片工作台</p><h1>把签证照，<br />裁到规则里面。</h1></div>
        <p className="lede">选择申请项目，上传一张清晰正面照，在安全框内调整并导出。规则来自官方页面，照片不会离开你的设备。</p>
      </section>

      <section className="workspace">
        <aside className="controls">
          <div className="step"><span>01</span><div><label htmlFor="spec">申请项目</label><select id="spec" value={specId} onChange={(e) => setSpecId(e.target.value)}>{photoSpecs.map((item) => <option key={item.id} value={item.id}>{item.country} · {item.name}</option>)}</select></div></div>
          <div className="spec-card"><div><strong>{spec.widthPx} × {spec.heightPx} px</strong><small>{spec.mode}</small></div><p>{spec.note}</p><a href={spec.source} target="_blank" rel="noreferrer">官方来源 ↗</a><small>核实于 {spec.verifiedAt}</small></div>
          <div className="step"><span>02</span><div><label htmlFor="file">选择正面照片</label><input id="file" type="file" accept="image/*" onChange={(e) => openFile(e.target.files?.[0])} /></div></div>
          <div className="step"><span>03</span><div className="range"><label htmlFor="zoom">缩放 <b>{zoom.toFixed(2)}×</b></label><input id="zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></div></div>
          <div className="backgrounds"><span>透明图底色</span>{backgrounds.map((color) => <button key={color} style={{ background: color }} aria-label={`底色 ${color}`} className={background === color ? "active" : ""} onClick={() => setBackground(color)} />)}</div>
          <button className="download" disabled={!image} onClick={download}>导出 JPEG <span>→</span></button>
          <p className="privacy">浏览器本地处理。刷新页面后，照片即从页面内存中清除。</p>
        </aside>

        <div className="stage">
          <div className="canvas-shell" style={{ aspectRatio: `${spec.widthPx}/${spec.heightPx}` }} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag({ x: e.clientX - offsetX / (spec.widthPx / e.currentTarget.clientWidth), y: e.clientY - offsetY / (spec.widthPx / e.currentTarget.clientWidth) }); }} onPointerMove={move} onPointerUp={() => setDrag(null)}>
            <canvas ref={canvasRef} />
            {!image && <div className="empty"><b>上传照片后在这里调整</b><span>支持 JPG、PNG 和手机照片</span></div>}
            <div className="guide"><i className="eyes" /><i className="chin" /><span>眼睛线</span></div>
          </div>
          <p className="stage-note">拖动照片调整位置；辅助线仅供构图参考，当前版本不会自动识别人脸。</p>
        </div>
      </section>

      <section className="pending"><div><p className="eyebrow">NEXT DESTINATIONS</p><h2>正在核验的模板</h2></div>{pendingSpecs.map((item) => <article key={item.country}><strong>{item.country}</strong><span>{item.detail}</span><em>待核验</em></article>)}</section>
      <footer><span>VISA GO / 0.1</span><p>本工具不代表任何政府或签证机构，最终要求以申请页面为准。</p></footer>
    </main>
  );
}
