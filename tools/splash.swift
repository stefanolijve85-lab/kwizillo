// The launch screen: the app icon (rounded, soft shadow) in the middle of the
// brand blue. One mark, drawn three ways from assets/brand/app-icon-1024.png:
//   assets/brand/splash-mark.png        the mark itself, for the web page
//   iOS Splash.imageset (2732 square)   shown aspect-fill by LaunchScreen.storyboard
//   Android drawable*/splash.png        one per density and orientation
//
//   swift tools/splash.swift
//
// Size rule, the same everywhere so the native screen and the page line up to
// the pixel: the icon is ICON of the screen's longer side (an aspect-filled
// square scales with the longer side). intro-early.js uses the same numbers.
import AppKit
import CoreGraphics

let ICON = 0.18485          // icon edge / longer screen side  (≈ 40% of a phone's width)
let PAD = 0.14              // transparent margin round the icon for its shadow, per side, / icon edge
let BLUE = CGColor(srgbRed: 0x1d / 255.0, green: 0x5f / 255.0, blue: 0xa8 / 255.0, alpha: 1)

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let icon = NSImage(contentsOf: root.appendingPathComponent("assets/brand/app-icon-1024.png"))!
  .cgImage(forProposedRect: nil, context: nil, hints: nil)!

// The mark: icon of edge `e` px with its shadow, centred on (cx, cy).
func drawMark(_ ctx: CGContext, cx: CGFloat, cy: CGFloat, e: CGFloat) {
  let rect = CGRect(x: cx - e / 2, y: cy - e / 2, width: e, height: e)
  let path = CGPath(roundedRect: rect, cornerWidth: e * 0.2237, cornerHeight: e * 0.2237, transform: nil)
  ctx.saveGState()
  ctx.setShadow(offset: CGSize(width: 0, height: -e * 0.035), blur: e * 0.09, color: CGColor(srgbRed: 0, green: 0.08, blue: 0.27, alpha: 0.45))
  ctx.addPath(path); ctx.setFillColor(BLUE); ctx.fillPath()
  ctx.restoreGState()
  ctx.saveGState(); ctx.addPath(path); ctx.clip(); ctx.interpolationQuality = .high; ctx.draw(icon, in: rect); ctx.restoreGState()
}

func canvas(_ w: Int, _ h: Int, opaque: Bool) -> CGContext {
  CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!,
            bitmapInfo: opaque ? CGImageAlphaInfo.noneSkipLast.rawValue : CGImageAlphaInfo.premultipliedLast.rawValue)!
}

func save(_ ctx: CGContext, _ path: String) {
  let url = root.appendingPathComponent(path)
  try! NSBitmapImageRep(cgImage: ctx.makeImage()!).representation(using: .png, properties: [:])!.write(to: url)
  print("\(path)  \(ctx.width)x\(ctx.height)")
}

// The page's copy: icon 512 px plus its margin.
let e = 512.0, side = Int(e * (1 + 2 * PAD))
let mark = canvas(side, side, opaque: false)
drawMark(mark, cx: CGFloat(side) / 2, cy: CGFloat(side) / 2, e: e)
save(mark, "assets/brand/splash-mark.png")

func splash(_ path: String) {
  let old = NSImage(contentsOf: root.appendingPathComponent(path))!.cgImage(forProposedRect: nil, context: nil, hints: nil)!
  let w = old.width, h = old.height
  let ctx = canvas(w, h, opaque: true)
  ctx.setFillColor(BLUE); ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  drawMark(ctx, cx: CGFloat(w) / 2, cy: CGFloat(h) / 2, e: CGFloat(ICON) * CGFloat(max(w, h)))
  save(ctx, path)
}

let fm = FileManager.default
for f in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"] {
  splash("ios/App/App/Assets.xcassets/Splash.imageset/\(f)")
}
let res = root.appendingPathComponent("android/app/src/main/res")
for dir in (try? fm.contentsOfDirectory(atPath: res.path))?.sorted() ?? [] where dir.hasPrefix("drawable") {
  if fm.fileExists(atPath: res.appendingPathComponent("\(dir)/splash.png").path) { splash("android/app/src/main/res/\(dir)/splash.png") }
}
