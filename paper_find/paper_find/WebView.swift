import SwiftUI
import WebKit

#if os(iOS) || os(tvOS) || os(visionOS)
struct WebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.bounces = false
        webView.backgroundColor = .clear
        webView.isOpaque = false

        // 加载 index.html：优先本地，失败则回退到本机预览端口
        if let resourceURL = Bundle.main.resourceURL?.appendingPathComponent("WebAssets") {
            let indexURL = resourceURL.appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: indexURL.path) {
                webView.loadFileURL(indexURL, allowingReadAccessTo: resourceURL)
            } else if let remoteURL = URL(string: "http://localhost:8090/index.html") {
                webView.load(URLRequest(url: remoteURL))
            }
        } else if let remoteURL = URL(string: "http://localhost:8090/index.html") {
            webView.load(URLRequest(url: remoteURL))
        }

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // 无需动态更新
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    class Coordinator: NSObject, WKNavigationDelegate {
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url, url.isFileURL {
                decisionHandler(.allow)
                return
            }
            decisionHandler(.allow)
        }
    }
}
#elseif os(macOS)
struct WebView: NSViewRepresentable {
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        // macOS 无 bounces 属性，去掉；背景透明通过 drawsBackground 控制
        if webView.responds(to: Selector(("setDrawsBackground:"))) {
            webView.setValue(false, forKey: "drawsBackground")
        }

        if let resourceURL = Bundle.main.resourceURL?.appendingPathComponent("WebAssets") {
            let indexURL = resourceURL.appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: indexURL.path) {
                webView.loadFileURL(indexURL, allowingReadAccessTo: resourceURL)
            }
        }

        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {
        // 无需动态更新
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    class Coordinator: NSObject, WKNavigationDelegate {
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url, url.isFileURL {
                decisionHandler(.allow)
                return
            }
            decisionHandler(.allow)
        }
    }
}
#endif