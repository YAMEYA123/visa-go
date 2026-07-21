# Visa Go

一个隐私优先的本地证件照工作台。照片只在浏览器中读取、裁剪和导出，不上传服务器。

## 当前能力

- 预置美国非移民签证、加拿大临时居民签证（纸质）、英国数字签证照片规则
- 支持上传、拖动、缩放、透明图片底色预览与 JPEG 导出
- 自动压缩到模板文件上限，并显示导出检查报告
- 浏览器支持原生人脸检测时自动居中，不支持时保留完整手动模式
- 每条规格显示状态、官方来源及最后核实日期
- 申根与日本模板暂列为“待核验”，不会套用未经确认的数值

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
- 当前版本不加载远程模型、远程字体或第三方分析脚本

## 规格来源

| 模板 | 状态 | 核实日期 | 官方来源 |
| --- | --- | --- | --- |
| 美国非移民签证 | 已核实 | 2026-07-21 | [U.S. Department of State](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html) |
| 加拿大临时居民签证（纸质） | 已核实 | 2026-07-21 | [Immigration, Refugees and Citizenship Canada](https://www.canada.ca/en/immigration-refugees-citizenship/services/application/application-forms-guides/temporary-resident-visa-application-photograph-specifications.html) |
| 英国数字签证照片 | 已核实 | 2026-07-21 | [UK Visas and Immigration](https://www.gov.uk/guidance/how-to-take-a-photo-for-a-visa-application-or-permission) |
| 申根签证 | 待核验 | — | 需按受理国与递交渠道确认 |
| 日本签证 | 待核验 | — | 需确认具体签证类别及递交机构 |

## 技术方案

- React + TypeScript + Vite
- Canvas 本地图像处理
- Vitest 规则测试
- 原生 FaceDetector 渐进增强；不支持时保留手动模式

## 后续计划

1. 核验申根与日本签证模板
2. 评估跨浏览器人脸关键点模型，并保留手动校正
3. 增加韩国、澳大利亚、新西兰、新加坡和印度
4. 增加 PWA 离线缓存；明确排除用户照片缓存
