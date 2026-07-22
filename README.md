# Visa Go

一个隐私优先的本地证件照工作台。照片只在浏览器中读取、裁剪和导出，不上传服务器。

## 当前能力

- 预置美国、加拿大、英国、申根、日本、韩国、新西兰、新加坡和印度签证照片规则
- 支持上传、拖动、缩放、透明图片底色预览与 JPEG 导出
- 自动压缩到模板文件上限，并显示导出检查报告
- 在本地提示亮度、过曝/欠曝、清晰度、人脸数量和头部倾斜风险
- MediaPipe 在本地识别人脸并自动居中，推理失败时保留完整手动模式
- 内置 MediaPipe 人像分割与人脸关键点模型，普通照片可在本地换底色
- 支持蒙版擦除、原图恢复、画笔大小、最多 10 步撤销和一键重置
- 每条规格显示状态、官方来源及最后核实日期
- 纸质照片按 600 DPI 生成像素文件；打印时仍需保持标注的毫米尺寸
- 规格可禁止背景替换；例如新西兰模板会强制保留原始背景
- 支持安装为 PWA；首次完整加载后，应用、规格、模型和 WASM 可离线使用

> Visa Go 只能辅助裁剪和检查确定性规则，不能保证照片被使领馆或签证中心接受。部分机构明确禁止数字修改；请以申请页面的最新要求为准。

## 本地运行

```bash
npm install
npm run dev -- --port 4173
```

构建与检查：

```bash
npm run typecheck
npm run test
npm run build
```

不要使用 `127.0.0.1:8080`；本项目建议使用 `4173` 或其他空闲端口。

## 隐私设计

- 不提供图片上传接口
- 不使用数据库或账户系统
- 图片保存在页面内存中，刷新页面后丢失
- 下载通过浏览器 Blob URL 完成
- 模型、WASM 和照片处理全部来自本地静态资源，不依赖远程推理接口
- Service Worker 只预缓存版本化静态资源，不配置用户图片运行时缓存
- MediaPipe Tasks 可能产生运行指标；正式发布前需依据目标地区评估是否需要用户告知或禁用策略

## 规格来源

| 模板 | 状态 | 核实日期 | 官方来源 |
| --- | --- | --- | --- |
| 美国非移民签证 | 已核实 | 2026-07-21 | [U.S. Department of State](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html) |
| 加拿大临时居民签证（纸质） | 已核实 | 2026-07-21 | [Immigration, Refugees and Citizenship Canada](https://www.canada.ca/en/immigration-refugees-citizenship/services/application/application-forms-guides/temporary-resident-visa-application-photograph-specifications.html) |
| 英国数字签证照片 | 已核实 | 2026-07-21 | [UK Visas and Immigration](https://www.gov.uk/guidance/how-to-take-a-photo-for-a-visa-application-or-permission) |
| 申根短期签证（纸质） | 已核实 | 2026-07-21 | [European Commission](https://home-affairs.ec.europa.eu/document/download/71052552-a6e7-4581-9857-04fb5ace6bc5_en) |
| 日本入境签证（纸质） | 已核实 | 2026-07-21 | [Ministry of Foreign Affairs of Japan](https://www.mofa.go.jp/j_info/visit/visa/pdfs/application1_k.pdf) |
| 韩国入境签证（纸质） | 已核实 | 2026-07-21 | [大韩民国驻广州总领事馆](https://overseas.mofa.go.kr/upload/cntnts/cn-guangzhou-zh/visa_gw.pdf) |
| 新西兰在线签证 | 已核实 | 2026-07-22 | [Immigration New Zealand](https://www.immigration.govt.nz/process-to-apply/applying-for-a-visa/applying-online/uploading-documents-and-photos/visa-and-nzeta-photos/) |
| 新加坡入境签证（SAVE） | 已核实 | 2026-07-22 | [Singapore Immigration & Checkpoints Authority](https://www.ica.gov.sg/docs/default-source/ica/files/save-non-pub-ava_sp-user-guide-for-family-visa-application.pdf) |
| 印度 e-Visa | 已核实 | 2026-07-22 | [India Visa Online](https://indianvisaonline.gov.in/visa/tvoa.html) |

申根递交细节可能因受理国而异；日本驻华不同领区可能提供不同版本申请表。系统会给出通用模板，但递交前仍应核对当地官方要求。

澳大利亚签证通过 ImmiAccount 上传 `JPG` facial image，官方公开说明的文件范围为 70 KB–3.5 MB，并由申请系统提供居中框选；由于没有统一公开的强制像素尺寸，Visa Go 暂不提供一个可能误导用户的固定尺寸模板。

## 技术方案

- React + TypeScript + Vite
- Canvas 本地图像处理
- Vitest 规则测试
- MediaPipe Face Landmarker + Selfie Segmenter，本地 WASM 推理
- 第三方许可证见 `THIRD_PARTY_LICENSES.md`
- Vite PWA + Workbox 静态预缓存，自动清理旧版本缓存

## 离线安装

1. 在线打开已部署的 Visa Go，等待页面和模型首次加载完成。
2. 使用浏览器的“安装应用”或“添加到主屏幕”。
3. 此后可以断网打开；页面右上角会显示“离线模式 · 本地可用”。

Service Worker 仅缓存构建产物、应用图标、MediaPipe 模型和 WASM。用户上传的原图、处理中间画布和 Blob 下载不会写入 Cache Storage。

## GitHub Pages 发布

生产构建产物发布到 `gh-pages` 分支，站点地址为：

`https://yameya123.github.io/visa-go/`

仓库 Settings → Pages 的 Source 需要选择 **Deploy from a branch**，分支选择 `gh-pages` 与根目录 `/ (root)`。构建配置已使用 `/visa-go/` 作为静态资源与 PWA 作用域。

## 后续计划

1. 增加 6 寸相纸打印排版
2. 持续跟踪澳大利亚申请系统与各国规则更新
