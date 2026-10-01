// The launch screen: the opening film's very first frame, so the app opens on
// the picture the film starts with and the film takes over without a seam.
//
//   swift tools/splash.swift
//
// 1. Takes frame 0 of both films with tools/bin/ffmpeg (BT.709, as the web
//    view decodes them) into assets/brand/intro-first.png and
//    intro-wide-first.png. intro-early.js shows the same file on the page.
// 2. iOS Splash.imageset: the portrait frame for iPhone, the wide frame for
//    iPad. LaunchScreen.storyboard shows it aspect-fill, which crops exactly as
//    the film's object-fit:cover does.
// 3. Android drawable*/splash.png: each one the frame cropped to its own size
//    (portrait folders the portrait film, landscape folders the wide film).
import AppKit
import CoreGraphics

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let fm = FileManager.default

func firstFrame(_ film: String, _ out: String) {
  let p = Process()
  p.executableURL = root.appendingPathComponent("tools/bin/ffmpeg")
  p.arguments = ["-v", "error", "-y", "-i", "assets/brand/\(film)", "-frames:v", "1",
                 "-vf", "scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24", "assets/brand/\(out)"]
  try! p.run(); p.waitUntilExit()
  precondition(p.terminationStatus == 0, "ffmpeg failed on \(film)")
  print("assets/brand/\(out)")
}
firstFrame("intro.mp4", "intro-first.png")
firstFrame("intro-wide.mp4", "intro-wide-first.png")

func load(_ path: String) -> CGImage {
  NSImage(contentsOf: root.appendingPathComponent(path))!.cgImage(forProposedRect: nil, context: nil, hints: nil)!
}
let tall = load("assets/brand/intro-first.png")
let wide = load("assets/brand/intro-wide-first.png")

func save(_ img: CGImage, _ path: String) {
  try! NSBitmapImageRep(cgImage: img).representation(using: .png, properties: [:])!.write(to: root.appendingPathComponent(path))
  print("\(path)  \(img.width)x\(img.height)")
}

// `src` scaled to cover w x h and centred, as object-fit:cover does.
func cover(_ src: CGImage, _ w: Int, _ h: Int) -> CGImage {
  let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                      space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  let s = max(Double(w) / Double(src.width), Double(h) / Double(src.height))
  let dw = Double(src.width) * s, dh = Double(src.height) * s
  ctx.interpolationQuality = .high
  ctx.draw(src, in: CGRect(x: (Double(w) - dw) / 2, y: (Double(h) - dh) / 2, width: dw, height: dh))
  return ctx.makeImage()!
}

// iOS: the frames as they are (the image view does the cropping).
let set = "ios/App/App/Assets.xcassets/Splash.imageset"
for f in (try? fm.contentsOfDirectory(atPath: root.appendingPathComponent(set).path)) ?? [] where f.hasSuffix(".png") {
  try? fm.removeItem(at: root.appendingPathComponent("\(set)/\(f)"))
}
var entries: [String] = []
for (idiom, img, scales) in [("iphone", tall, ["1x", "2x", "3x"]), ("ipad", wide, ["1x", "2x"])] {
  for sc in scales {
    let f = "splash-\(idiom)@\(sc).png"
    save(img, "\(set)/\(f)")
    entries.append("    { \"idiom\" : \"\(idiom)\", \"filename\" : \"\(f)\", \"scale\" : \"\(sc)\" }")
  }
}
try! "{\n  \"images\" : [\n\(entries.joined(separator: ",\n"))\n  ],\n  \"info\" : { \"version\" : 1, \"author\" : \"xcode\" }\n}\n"
  .write(to: root.appendingPathComponent("\(set)/Contents.json"), atomically: true, encoding: .utf8)

// Android: every splash.png keeps its size and gets the frame cropped to it.
let res = root.appendingPathComponent("android/app/src/main/res")
for dir in (try? fm.contentsOfDirectory(atPath: res.path))?.sorted() ?? [] where dir.hasPrefix("drawable") {
  let path = "android/app/src/main/res/\(dir)/splash.png"
  guard fm.fileExists(atPath: root.appendingPathComponent(path).path) else { continue }
  let old = load(path)
  save(cover(old.width > old.height ? wide : tall, old.width, old.height), path)
}
