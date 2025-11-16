# 📱 iOS 封装准备指南（WKWebView 方案）

本指南帮助你将当前 Web 前端（HTML/CSS/JS）封装为 iOS 应用，重点解决 API 地址、资源打包、网络安全（ATS）等关键问题。

## 前置条件
- macOS + Xcode 15+
- Apple Developer 账号（真机调试与上架需要）
- 已部署的后端服务（建议 HTTPS 域名，例如 `https://api.your-domain.com`）

## 封装路线选择
- 方案A：原生 Swift + WKWebView（推荐）
  - 优点：无 Node 依赖、结构简单、与 Android WebView 对齐
  - 适用：现有页面无需改造、仅需网络访问和 localStorage

- 方案B：Capacitor（可选）
  - 优点：丰富插件生态、跨平台统一打包
  - 缺点：需要引入 Node/npm 与 Capacitor 工具链

下文以方案A（WKWebView）为主，方案B仅给出简要步骤。

---

## 步骤1：准备前端与配置
1. 在仓库根目录新增 `app-config.json`，设置后端 API 地址：
   ```json
   { "API_URL": "https://api.your-domain.com/api" }
   ```
   - 已内置示例 `app-config.example.json`，请复制为 `app-config.json` 并替换为实际地址。
   - 前端已支持动态加载配置，打包到 iOS 后无需改代码即可切换环境。

2. 本仓库已将 `script.js` 中的硬编码 API 地址改为可配置（`app-config.json` → `API_URL`）。

## 步骤2：部署后端（Flask）
- 部署到公网并启用 HTTPS（推荐使用可信证书）
- 保持当前的 CORS 设置（`CORS(app)`），以允许 WKWebView 发起跨域请求
- 示例端点：
  - `POST /api/get-papers`
  - `POST /api/save-selection`

## 步骤3：创建 Xcode 项目并嵌入前端资源
1. 打开 Xcode → File → New → Project → iOS → App（SwiftUI 或 UIKit 均可）
2. 将以下前端文件添加到 Xcode 项目的 `Resources` 或 `Assets`：
   - `index.html`, `library.html`
   - `style.css`, `library.css`
   - `script.js`
   - `app-config.json`
3. 在 Swift 代码中加载本地 HTML：
   ```swift
   import SwiftUI
   import WebKit

   struct WebView: UIViewRepresentable {
       func makeUIView(context: Context) -> WKWebView {
           let webView = WKWebView(frame: .zero)
           if let url = Bundle.main.url(forResource: "index", withExtension: "html") {
               // 允许访问整个资源目录（包含 CSS/JS/JSON）
               let dir = url.deletingLastPathComponent()
               webView.loadFileURL(url, allowingReadAccessTo: dir)
           }
           return webView
       }
       func updateUIView(_ uiView: WKWebView, context: Context) {}
   }

   struct ContentView: View {
       var body: some View { WebView() }
   }
   ```

4. 路由与页面间跳转
   - 当前前端通过超链接跳转 `index.html ↔ library.html`，WKWebView 会正常处理
   - 若需要原生导航栏，可在 Swift 层包裹 `WKWebView` 并拦截导航

## 步骤4：网络安全（ATS）与域名白名单
- 若后端使用 HTTPS（推荐）：无需额外设置
- 若必须使用 HTTP（不推荐）：在 `Info.plist` 添加 ATS 例外：
  ```xml
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsArbitraryLoads</key><true/>
    <key>NSExceptionDomains</key>
    <dict>
      <key>api.your-domain.com</key>
      <dict>
        <key>NSExceptionAllowsInsecureHTTPLoads</key><true/>
        <key>NSIncludesSubdomains</key><true/>
      </dict>
    </dict>
  </dict>
  ```

## 步骤5：运行与调试
- 选择模拟器或真机，构建并运行
- 在 Xcode 的 `Console` 观察日志；前端中 `console.log` 可通过 `WKWebView` 的开发者工具查看（真机需启用 Safari 开发）

## 方案B（可选）：Capacitor 快速封装
1. 在项目前端根目录初始化 Node 项目并安装 Capacitor：
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli
   npx cap init PaperSwipe com.example.paperswipe --web-dir .
   npx cap add ios
   ```
2. 将 `index.html` 等静态资源置于 `web-dir`（此处为仓库根目录），执行：
   ```bash
   npx cap copy
   npx cap open ios
   ```
3. 在 Xcode 构建并运行；如使用 HTTP，请按上文 ATS 设置。

## 验证清单
- [ ] `app-config.json` 已设置为 HTTPS 后端地址
- [ ] 后端可访问并返回正确 JSON 格式
- [ ] WKWebView 能加载本地 HTML 与静态资源
- [ ] iOS 真机/模拟器可发起 API 请求并成功解析返回

## 常见问题
- 跨域错误：确认后端已启用 CORS，且 `API_URL` 域名与协议正确
- 本地资源无法加载：确保通过 `loadFileURL(..., allowingReadAccessTo: ...)` 授予目录访问
- 字体加载异常：Google Fonts 在部分网络环境不可达，可改为本地字体或替换 CDN

---

如需我直接为你创建一个最小可运行的 Xcode 项目骨架，请告诉我 Bundle ID 与期望的应用名称。