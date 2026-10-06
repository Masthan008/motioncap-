语言: [EN](README.md) | 简中

<p align="center">
  <img width="220" alt="MotionCap logo" src="https://github.com/user-attachments/assets/082bb4b0-5fc5-4e9f-abda-55611fd6aded" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-111827?style=for-the-badge" alt="macOS Windows Linux" />
  <img src="https://img.shields.io/badge/open%20source-AGPL3.0-2563eb?style=for-the-badge" alt="AGPL 3.0 license" />
</p>

### 无需额外剪辑，也能做出精致的屏幕录制。
[MotionCap](https://www.motioncap.dev) 是一款**开源屏幕录制器**和编辑器，适合制作**操作讲解、演示、产品视频**等内容。  
**欢迎提交 PR。** [赞助](https://ko-fi.com/webadderall/goal?g=0)

https://github.com/user-attachments/assets/9b66c71d-ac97-49ff-a0c9-63ac26edf2e4

---

## MotionCap 是什么？

MotionCap 是一款桌面应用，用于录制并编辑屏幕内容，内置面向演示视频的动态呈现工具。你不需要再把原始素材交给动效设计师去补缩放、光标润色或样式化背景，MotionCap 可以在一个地方免费完成整套流程。

MotionCap 支持：

- **macOS** 14.0+
- **Windows** 10 Build 19041+
- **Linux** 现代发行版

平台说明：

- **macOS** 使用基于 ScreenCaptureKit 的原生捕获辅助程序。
- **Windows** 在支持的系统版本上使用原生 Windows Graphics Capture（WGC）辅助程序，并支持原生 WASAPI 音频。
- **Linux** 通过 Electron 捕获 API 录制。目前 Linux 还不支持隐藏真实光标。

---

# 核心功能

## visionOS 液态玻璃浮动 HUD 与流体微动效
体验灵感源自 visionOS 的通透悬浮 HUD。支持表面张力水滴弹性微动效、弹簧交互物理回弹、全自动智能鼠标穿透与触觉级录制反馈。

## 录制室级别 4K 60FPS 超清画质与锐利文本
专为开发者教程与产品走查优化打造：
- **高达 85 Mbps 码率宽容度**：彻底消除终端命令行与代码编辑器中文字边缘的压缩马赛克。
- **硬件加速 VP9 与 H.264 High Profile**：即便在快速平移或剧烈窗口缩放时，亚像素渲染与细微边框依然清晰可见。
- **Studio Lossless 无损级别导出**：导出码率较之前翻倍，呈现与原生高分屏一致的母带级质感。

## visionOS 液态玻璃演播级摄像头
为讲解出镜画面带来光学玻璃级质感提升：
- **多形态变形**：流畅连续圆角 Squircle、正圆 Circle、超宽 Studio Pill 胶囊与 4:5 肖像画幅。
- **光学高光折射与呼吸光环**：多层折射高光边框，搭配随录制呼吸闪烁的青紫氛围边缘光晕。
- **悬浮 visionOS 快捷工具栏**：鼠标悬停即刻呼出形态切换、尺寸预设（S / M / L）、水平镜像翻转与演播滤镜（自然、演播暖调、鲜艳、黑白胶片）。

## 自动缩放、光标润色与样式化画面
MotionCap 可以根据操作自动强调重点区域，平滑光标运动，添加动态效果，并将最终画面放进带有壁纸、纯色、渐变、模糊、留白和阴影的样式化边框中。

<p>
  <img src="./docs/media/feature1.gif" width="450" alt="MotionCap cursor and zoom demo video">
</p>

## 签名版 8K 与 4K 精选壁纸库
内置手工调色签名壁纸（**Cyber Flow**、**Solar Horizon**），并收录 Windows 11 Bloom 与 macOS Sequoia 官方桌面壁纸，支持自定义渐变、亚克力毛玻璃模糊与柔和阴影。

## 为演示设计的时间线编辑
使用拖拽式时间线工具处理缩放、裁剪、变速区域、注释、额外音频区域以及裁切感知编辑，并将工作保存为 `.motioncap` 项目文件，之后随时回来继续编辑。

<p>
  <img width="450" alt="timeline editor" src="https://github.com/user-attachments/assets/3692bd8f-7b8d-4a93-b696-d17c828487ea" />
</p>

## 扩展与市场

MotionCap 拥有一个社区驱动的扩展系统。任何人都可以构建和发布扩展来为 MotionCap 添加新功能，例如光标点击音效、设备边框、浏览器模拟外壳、壁纸、渲染钩子、设置面板等等。

浏览并安装社区扩展：[MotionCap 扩展市场](https://marketplace.motioncap.dev/extensions)。

---

## 快捷键快速参考

| 操作 | 快捷键 (Windows / Linux) | 快捷键 (macOS) |
|---|---|---|
| **开始 / 停止录制** | `F9` 或 `Space`（HUD内） | `F9` 或 `Space` |
| **暂停 / 继续录制** | `F10` | `F10` |
| **重新打开新手引导教程** | `Ctrl + Shift + O` | `⌘ + Shift + O` |
| **快速循环切换壁纸** | `Ctrl + Shift + W` | `⌘ + Shift + W` |
| **开关摄像头画面** | `Ctrl + Shift + C` | `⌘ + Shift + C` |
| **时间线分割片段** | `S` | `S` |
| **删除选定片段** | `Delete` / `Backspace` | `Delete` |

---

## 全部功能

### 录制与捕获引擎

- **原生 Windows Graphics Capture (WGC)**：硬件加速桌面捕获，零延迟兼备原生 WASAPI 音频回环。
- **macOS ScreenCaptureKit**：60 FPS 超平滑系统捕获与独立应用音频隔离。
- **Studio 码率流水线**：30–85 Mbps 专为 Retina 及 4K 显示器设计的超高码率方案。
- **交互式区域选取器**：像素级十字准星对准与高倍放大镜微调选区。
- 录制整个显示器或单个应用窗口。
- 从保存的 `.motioncap` 项目文件继续编辑。

### visionOS 演播级摄像头

- 悬浮 visionOS 玻璃质感与边缘折射高光。
- 4 种变形形态：Squircle 圆角矩形、Circle 正圆、Pill 胶囊、4:5 肖像。
- 3 档尺寸预设：Small（小）、Medium（标准）、Large（醒目出镜）。
- 一键水平镜像与电影级色彩滤镜切换。
- 拖拽平移与视口边缘安全对齐。

### 时间线与编辑

- 拖拽式时间线编辑
- 裁掉不需要的片段
- 添加手动缩放区域
- 根据光标活动生成自动缩放建议
- 添加加速和减速区域
- 添加文本、图片和图形注释
- 在时间线上添加额外音频区域
- 裁切录制画面
- 保存并重新打开项目，保留编辑状态

### 光标控制

- 显示或隐藏渲染后的光标叠加层
- 调整光标大小
- 光标平滑
- 光标运动模糊
- 点击弹跳效果
- 光标摆动效果
- 光标循环模式，方便导出更自然的循环片段
- 使用 macOS 风格的渲染光标素材

### 画面样式与背景

- 签名版 8K 壁纸（Cyber Flow、Solar Horizon）
- 10+ 款官方 4K Windows 11 与 macOS 精选壁纸
- 运行时自动发现 wallpapers 目录中的壁纸
- 上传自定义背景图片
- 纯色背景
- 渐变背景
- 画面留白
- 圆角
- 背景模糊
- 投影阴影
- 最终画面的宽高比预设

### 导出

- MP4 导出，支持超高码率渲染（4K 可达 75 Mbps）
- GIF 导出，支持自定义帧率与循环开关
- Studio Lossless 超清品质选项
- 宽高比和输出尺寸控制
- 在系统文件管理器中定位导出文件

### 工作流与易用性

- 4 步沉浸式新手引导交互式教程（带麦克风实时动态电平表）
- 可自定义键盘快捷键与内置参考表
- 在编辑器中直接打开反馈和问题链接
- 编辑器偏好设置持久化

---

# 截图

<p align="center">
  <img src="https://i.postimg.cc/8CrQtGJf/Screenshot-2026-04-30-at-5-11-52-pm.png" width="700" alt="MotionCap recording interface screenshot">
</p>

<p align="center">
  <img src="https://i.postimg.cc/pLSMfrTM/Screenshot-2026-04-30-at-5-11-45-pm.png" width="700" alt="MotionCap editor screenshot">
</p>

<p align="center">
  <img src="https://i.postimg.cc/Zn9VY6bg/Screenshot-2026-03-18-at-6-32-59-pm.png" width="700" alt="MotionCap timeline screenshot">
</p>

---

# 安装

## 下载构建版本

预构建发布版本请见：

https://github.com/Masthan008/motioncap-/releases

---

## Arch Linux / Manjaro（yay）

可通过 AUR 安装（[motioncap-bin](https://aur.archlinux.org/packages/motioncap-bin)）：

```bash
yay -S motioncap-bin
```

PKGBUILD、桌面入口、发布同步，以及可选的**本地源码打包**都维护在 **[motioncap-aur](https://github.com/firtoz/motioncap-aur)** 中，因此这个仓库本身不需要承担 Arch 发布维护工作。关于维护者联系方式和软件包更新方式，请查看该仓库或 AUR 软件包页面。

---

## 从源码构建

### 前置依赖

**macOS：** 安装 Xcode Command Line Tools（`xcode-select --install`）。

**Linux（Ubuntu / Debian）：**

```bash
sudo apt install build-essential cmake libx11-dev libxtst-dev libxrandr-dev libxt-dev
```

**Windows：** 安装 Visual Studio 2022（或 Build Tools），并勾选 C++ 工作负载和 CMake。

### 步骤

```bash
git clone https://github.com/Masthan008/motioncap-.git motioncap
cd motioncap
npm install
npm run dev
```

如果需要打包构建：

```bash
npm run build
```

也可以使用平台专用构建命令：

- `npm run build:mac`
- `npm run build:win`
- `npm run build:linux`

---

## macOS：“App cannot be opened”

本地构建的应用可能会被 macOS 隔离。

可以用以下命令移除隔离标记：

```bash
xattr -rd com.apple.quarantine /Applications/MotionCap.app
```

---

# 系统要求

| 平台 | 最低版本 | 说明 |
|---|---|---|
| **macOS** | macOS 14.0 (Sonoma) | 使用 ScreenCaptureKit 捕获音频和麦克风所必需。 |
| **Windows** | Windows 10 20H1（Build 19041，2020 年 5 月） | 原生 Windows Graphics Capture（WGC）辅助程序及最佳光标隐藏行为所必需。 |
| **Linux** | 任意现代发行版 | 通过 Electron 捕获录制。系统音频通常需要 PipeWire。 |

> [!IMPORTANT]
> 在 Windows 19041 之前的版本上，录制仍可能通过回退捕获方式工作，但真实系统光标可能仍会出现在视频中。

---

# 使用方法

## 录制

1. 启动 MotionCap。
2. 选择屏幕或窗口。
3. 选择麦克风和系统音频选项。
4. 开始录制。
5. 停止录制后进入编辑器。

## 编辑

在编辑器中，你可以：

- 添加裁剪、缩放、变速区域和注释
- 调整光标行为和预览音量
- 使用壁纸、纯色、渐变、模糊、留白和圆角来美化画面
- 添加或调整摄像头叠加素材
- 添加额外音频区域
- 裁切画面并选择宽高比

你可以随时将工作保存为 `.motioncap` 项目。

## 导出

支持以下导出格式：

- **MP4**，适合常规视频输出
- **GIF**，适合轻量分享和循环片段

你可以在导出前调整格式相关设置，例如质量、GIF 帧率、GIF 循环方式和输出尺寸。

---

# 限制

### 光标捕获

MotionCap 会在录制画面上渲染一个经过美化的光标叠加层，但真实系统光标是否能被隐藏仍取决于平台能力。

**macOS**
- ScreenCaptureKit 可以较干净地排除真实光标。

**Windows**
- 最佳效果需要 Windows 10 Build 19041+ 和原生捕获辅助程序。
- 较旧版本会回退到 Electron 捕获，因此真实光标可能仍会显示。

**Linux**
- Electron 桌面捕获目前不支持隐藏真实光标。
- 如果同时启用渲染光标叠加，导出中可能会同时看到真实光标和样式化光标。

### 系统音频

系统音频支持因平台而异。

**Windows**
- 原生 WASAPI 支持

**Linux**
- 通常需要 PipeWire

**macOS**
- 需要 macOS 14.0+ 和基于 ScreenCaptureKit 的工作流

---

# 工作原理

MotionCap 将平台相关的捕获层与基于渲染器的编辑、导出流程结合在一起。

**捕获**
- Electron 负责录制流程和应用级控制
- macOS 使用原生 ScreenCaptureKit 辅助程序
- Windows 在可用时使用原生 Windows Graphics Capture（WGC）辅助程序和原生音频辅助程序

**编辑**
- 时间线区域定义缩放、裁剪、变速、音频叠加和注释
- 光标和摄像头样式都保存在编辑器状态中

**渲染**
- 场景合成由 **PixiJS** 负责

**导出**
- 预览使用的同一套场景逻辑会被用于导出 MP4 或 GIF

**项目**
- `.motioncap` 文件会保存源媒体路径和编辑器状态，方便后续继续编辑

---

# 贡献

欢迎贡献。

特别需要帮助的方向包括：

- Linux 录制与光标行为改进
- 导出性能与稳定性优化
- UI 和 UX 打磨
- 本地化工作
- 更多编辑工具与工作流优化

请尽量让 Pull Request 保持聚焦，测试录制、编辑、导出流程，并避免无关重构。

请参阅 `CONTRIBUTING.md` 了解具体指南。

---

# 社区

问题反馈和功能建议：

https://github.com/Masthan008/motioncap-/issues

欢迎提交 Pull Request。

---

# 支持者名单

[![Ko-Fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/webadderall)

- Tadees
- buildwithfur
- Tobias
- Anonymous Supporter
- Tandava Appadoo
- Digitalfastmind
- Roberto Marcelino
- Rajan RK
- Francesco
- Erwan
- Anonymous supporter

---

# 许可证

MotionCap 基于 **AGPL 3.0** 发布。

---

# 致谢

## 鸣谢

MotionCap 最初是从 [OpenScreen](https://github.com/siddharthvaddem/openscreen) 分叉而来，之后已逐步演变为一个不同的项目。

创建者  
[@webadderall](https://x.com/webadderall)

---
