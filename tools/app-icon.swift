// Every app icon from one 1024 x 1024 master (no alpha, as App Store Connect wants):
// the iOS asset catalog, the Android launcher icons (square, round and the adaptive
// foreground) and the Play Store icon.
//
//   swift tools/app-icon.swift assets/brand/app-icon-1024.png
//
// Android's adaptive icon shows only the middle 72 of its 108 dp and masks that to
// the launcher's shape, so the foreground is the whole master scaled to 80% and
// centred: the visible part is all artwork, and the K stays inside the safe zone.
// The background colour is the master's own edge, for the few pixels a parallax
// effect can reveal.
import AppKit
import CoreGraphics

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
guard CommandLine.arguments.count > 1,
      let src = NSImage(contentsOfFile: CommandLine.arguments[1]),
      let master = src.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  print("usage: swift tools/app-icon.swift <1024x1024 png>"); exit(1)
}

enum Shape { case square, rounded, circle }

func render(_ size: Int, shape: Shape = .square, scale: CGFloat = 1, background: CGColor? = nil, alpha: Bool = false) -> CGImage {
  let info = alpha ? CGImageAlphaInfo.premultipliedLast.rawValue : CGImageAlphaInfo.noneSkipLast.rawValue
  let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                      space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: info)!
  ctx.interpolationQuality = .high
  let s = CGFloat(size), full = CGRect(x: 0, y: 0, width: s, height: s)
  switch shape {
  case .square: break
  case .rounded: ctx.addPath(CGPath(roundedRect: full, cornerWidth: s * 0.18, cornerHeight: s * 0.18, transform: nil)); ctx.clip()
  case .circle: ctx.addEllipse(in: full); ctx.clip()
  }
  if let bg = background { ctx.setFillColor(bg); ctx.fill(full) }
  let w = s * scale
  ctx.draw(master, in: CGRect(x: (s - w) / 2, y: (s - w) / 2, width: w, height: w))
  return ctx.makeImage()!
}

func write(_ image: CGImage, _ path: String) {
  let url = root.appendingPathComponent(path)
  try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  let data = NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])!
  try! data.write(to: url)
  print("\(path)  \(image.width)x\(image.height)")
}

// The master's edge colour: the average of a thin frame round the picture.
func edgeColour() -> CGColor {
  let n = 64
  let ctx = CGContext(data: nil, width: n, height: n, bitsPerComponent: 8, bytesPerRow: n * 4,
                      space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  ctx.draw(master, in: CGRect(x: 0, y: 0, width: n, height: n))
  let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
  var r = 0, g = 0, b = 0, c = 0
  for y in 0..<n { for x in 0..<n where x < 2 || y < 2 || x >= n - 2 || y >= n - 2 {
    let i = (y * n + x) * 4; r += Int(p[i]); g += Int(p[i + 1]); b += Int(p[i + 2]); c += 1 } }
  return CGColor(srgbRed: CGFloat(r) / CGFloat(c * 255), green: CGFloat(g) / CGFloat(c * 255), blue: CGFloat(b) / CGFloat(c * 255), alpha: 1)
}

write(render(1024), "assets/brand/app-icon-1024.png")
write(render(1024), "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png")
write(render(512), "store/graphics/play-icon-512.png")

let edge = edgeColour()
for (density, launcher, foreground) in [("mdpi", 48, 108), ("hdpi", 72, 162), ("xhdpi", 96, 216), ("xxhdpi", 144, 324), ("xxxhdpi", 192, 432)] {
  let dir = "android/app/src/main/res/mipmap-\(density)"
  write(render(launcher, shape: .rounded, alpha: true), "\(dir)/ic_launcher.png")
  write(render(launcher, shape: .circle, alpha: true), "\(dir)/ic_launcher_round.png")
  write(render(foreground, scale: 0.8, background: edge), "\(dir)/ic_launcher_foreground.png")
}
let comps = edge.components!
let hex = String(format: "#%02X%02X%02X", Int(comps[0] * 255), Int(comps[1] * 255), Int(comps[2] * 255))
let xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<resources>\n    <color name=\"ic_launcher_background\">\(hex)</color>\n</resources>\n"
try! xml.write(to: root.appendingPathComponent("android/app/src/main/res/values/ic_launcher_background.xml"), atomically: true, encoding: .utf8)
print("android background \(hex)")
