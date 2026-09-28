// Run a controlled export test in the same system WebKit engine used by Tauri.
// Start Vite first, then: swift scripts/test-desktop-video-export.swift [base URL]
import AppKit
import WebKit

final class ExportTest: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        let configuration = WKWebViewConfiguration()
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.userContentController.add(self, name: "report")
        webView = WKWebView(frame: NSRect(x: 0, y: 0, width: 640, height: 420), configuration: configuration)
        webView.navigationDelegate = self
        window = NSWindow(contentRect: webView.frame, styleMask: [.titled, .closable], backing: .buffered, defer: false)
        window.title = "Shotage video export regression test"
        window.contentView = webView
        window.orderFront(nil)
        let base = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "http://127.0.0.1:5174"
        webView.load(URLRequest(url: URL(string: base + "/tests/browser/desktop-video-export.html")!))
        DispatchQueue.main.asyncAfter(deadline: .now() + 600) {
            print("FAIL: export test timed out")
            exit(1)
        }
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let text = message.body as? String else { return }
        print(text)
        fflush(stdout)
        guard let data = text.data(using: .utf8),
              let result = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              result["done"] as? Bool == true else { return }
        exit(result["passed"] as? Bool == true ? 0 : 1)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("FAIL: \(error)")
        exit(1)
    }
}

let app = NSApplication.shared
let delegate = ExportTest()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
