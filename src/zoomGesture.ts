export const clampZoom = (zoom: number) => Math.min(3, Math.max(1, zoom));

export function zoomAroundPoint(
  currentZoom: number,
  requestedZoom: number,
  offsetX: number,
  offsetY: number,
  anchorX: number,
  anchorY: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const zoom = clampZoom(requestedZoom);
  const ratio = zoom / currentZoom;
  return {
    zoom,
    offsetX: anchorX - canvasWidth / 2 - (anchorX - canvasWidth / 2 - offsetX) * ratio,
    offsetY: anchorY - canvasHeight / 2 - (anchorY - canvasHeight / 2 - offsetY) * ratio,
  };
}
