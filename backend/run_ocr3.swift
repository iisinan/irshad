import Cocoa
import Vision

func performOCR(on imagePath: String) {
    guard let image = NSImage(contentsOfFile: imagePath),
          let tiffData = image.tiffRepresentation,
          let bitmapImageRep = NSBitmapImageRep(data: tiffData),
          let cgImage = bitmapImageRep.cgImage else {
        return
    }

    let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    let request = VNRecognizeTextRequest { (request, error) in
        if let error = error { return }
        guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
        for observation in observations {
            guard let topCandidate = observation.topCandidates(1).first else { continue }
            print(topCandidate.string)
        }
    }
    request.recognitionLevel = .accurate
    do {
        try requestHandler.perform([request])
    } catch {}
}

for i in 30..<50 {
    let path = "thomaswy_page_\(i).png"
    if FileManager.default.fileExists(atPath: path) {
        print("==================== PAGE \(i) ====================")
        performOCR(on: path)
    }
}
