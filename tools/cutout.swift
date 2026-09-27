// Cuts the subject out of a picture, on this machine, with Vision.
//
//   swift tools/cutout.swift assets/mascots/*.jpg out/dir
//
// macOS has had a subject-lifting model since Sonoma — the same one Preview and
// Photos use for "Remove Background". It knows what a character is, which a
// colour-based flood fill does not: these renders sit on flat tints, vignettes,
// a grass scene and a painted frame, and a pixel rule that handles one ruins the
// next. Nothing leaves the machine and nothing is paid for.
//
// Writes <name>.png with a real alpha channel, the same size as the input.
import Foundation
import Vision
import CoreImage
import AppKit

let args = Array(CommandLine.arguments.dropFirst())
guard args.count >= 2 else {
    FileHandle.standardError.write("usage: swift tools/cutout.swift <image…> <output dir>\n".data(using: .utf8)!)
    exit(2)
}
let outDir = URL(fileURLWithPath: args.last!, isDirectory: true)
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
let inputs = args.dropLast().map { URL(fileURLWithPath: $0) }
let context = CIContext()
var failed = 0

for url in inputs {
    guard let image = CIImage(contentsOf: url) else {
        print("\(url.lastPathComponent): could not be read"); failed += 1; continue
    }
    let handler = VNImageRequestHandler(ciImage: image, options: [:])
    let request = VNGenerateForegroundInstanceMaskRequest()
    do {
        try handler.perform([request])
        guard let result = request.results?.first, !result.allInstances.isEmpty else {
            print("\(url.lastPathComponent): no subject found"); failed += 1; continue
        }
        // Every instance the model found together: a character holding something
        // is two instances, and both belong to the buddy.
        let buffer = try result.generateMaskedImage(ofInstances: result.allInstances,
                                                    from: handler,
                                                    croppedToInstancesExtent: false)
        let cut = CIImage(cvPixelBuffer: buffer)
        let out = outDir.appendingPathComponent(url.deletingPathExtension().lastPathComponent + ".png")
        guard let data = context.pngRepresentation(of: cut,
                                                   format: .RGBA8,
                                                   colorSpace: CGColorSpaceCreateDeviceRGB()) else {
            print("\(url.lastPathComponent): could not be written"); failed += 1; continue
        }
        try data.write(to: out)
        let kb = (try? FileManager.default.attributesOfItem(atPath: out.path)[.size] as? Int).flatMap { $0 } ?? 0
        print("\(url.lastPathComponent): \(result.allInstances.count) subject(s) → \(out.lastPathComponent) (\(kb / 1024) kB)")
    } catch {
        print("\(url.lastPathComponent): \(error.localizedDescription)"); failed += 1
    }
}
exit(failed == 0 ? 0 : 1)
