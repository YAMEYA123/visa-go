import { FaceLandmarker, FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";

export type FaceBounds = { left: number; top: number; right: number; bottom: number; rollDegrees?: number };
export type VisionResult = { cutout: HTMLCanvasElement; faceCount: number; face?: FaceBounds };

let tasksPromise: Promise<{ face: FaceLandmarker; segmenter: ImageSegmenter }> | undefined;

async function getTasks() {
  tasksPromise ??= (async () => {
    const baseUrl = import.meta.env.BASE_URL;
    const fileset = await FilesetResolver.forVisionTasks(`${baseUrl}mediapipe/wasm`);
    const [face, segmenter] = await Promise.all([
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: `${baseUrl}models/face_landmarker.task`, delegate: "CPU" },
        runningMode: "IMAGE",
        numFaces: 2,
      }),
      ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: `${baseUrl}models/selfie_segmenter.tflite`, delegate: "CPU" },
        runningMode: "IMAGE",
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      }),
    ]);
    return { face, segmenter };
  })();
  try {
    return await tasksPromise;
  } catch (error) {
    tasksPromise = undefined;
    throw error;
  }
}

export async function analyzePhoto(image: HTMLImageElement): Promise<VisionResult> {
  const { face, segmenter } = await getTasks();
  const segmentation = segmenter.segment(image);
  const mask = segmentation.confidenceMasks?.[0];
  if (!mask) throw new Error("人像分割未返回蒙版");

  const maskPixels = mask.getAsFloat32Array();
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = mask.width;
  maskCanvas.height = mask.height;
  const maskContext = maskCanvas.getContext("2d")!;
  const maskImage = maskContext.createImageData(mask.width, mask.height);
  for (let index = 0; index < maskPixels.length; index += 1) {
    const alpha = Math.round(Math.max(0, Math.min(1, maskPixels[index])) * 255);
    const offset = index * 4;
    maskImage.data[offset] = 255;
    maskImage.data[offset + 1] = 255;
    maskImage.data[offset + 2] = 255;
    maskImage.data[offset + 3] = alpha;
  }
  maskContext.putImageData(maskImage, 0, 0);

  const cutout = document.createElement("canvas");
  cutout.width = image.naturalWidth;
  cutout.height = image.naturalHeight;
  const context = cutout.getContext("2d")!;
  context.drawImage(image, 0, 0);
  context.globalCompositeOperation = "destination-in";
  context.drawImage(maskCanvas, 0, 0, cutout.width, cutout.height);
  context.globalCompositeOperation = "source-over";
  mask.close();

  const faces = face.detect(image).faceLandmarks;
  if (faces.length !== 1) return { cutout, faceCount: faces.length };
  const xs = faces[0].map((point) => point.x);
  const ys = faces[0].map((point) => point.y);
  const leftEye = faces[0][33];
  const rightEye = faces[0][263];
  return {
    cutout,
    faceCount: 1,
    face: {
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys),
      rollDegrees: Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI,
    },
  };
}
