import Vision
import AppKit
import Foundation

let args = CommandLine.arguments
if args.count < 2 { exit(1) }
let path = args[1]
guard let img = NSImage(contentsOfFile: path),
      let cgImage = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(1) }

let request = VNRecognizeTextRequest { (request, error) in
    guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
    for obs in observations {
        if let topCandidate = obs.topCandidates(1).first {
            print(topCandidate.string)
        }
    }
}
request.recognitionLevel = .accurate
let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
try? handler.perform([request])
