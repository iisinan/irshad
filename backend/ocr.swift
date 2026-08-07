import Foundation
import Cocoa
import Vision
import PDFKit

guard CommandLine.arguments.count > 1 else {
    print("Usage: swift ocr.swift <path to pdf>")
    exit(1)
}

let pdfPath = CommandLine.arguments[1]
let url = URL(fileURLWithPath: pdfPath)
guard let pdfDoc = PDFDocument(url: url) else {
    print("Cannot open PDF")
    exit(1)
}

let numPages = min(12, pdfDoc.pageCount)

for i in 0..<numPages {
    guard let page = pdfDoc.page(at: i) else { continue }
    let pageRect = page.bounds(for: .mediaBox)
    let nsImage = NSImage(size: pageRect.size)
    nsImage.lockFocus()
    
    // Fill white background
    NSColor.white.set()
    pageRect.fill()
    
    if let ctx = NSGraphicsContext.current?.cgContext {
        page.draw(with: .mediaBox, to: ctx)
    }
    nsImage.unlockFocus()
    
    guard let cgImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    
    let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    let request = VNRecognizeTextRequest { (request, error) in
        guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
        print("==================== PAGE \(i) ====================")
        for observation in observations {
            if let topCandidate = observation.topCandidates(1).first {
                print(topCandidate.string)
            }
        }
    }
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    try? requestHandler.perform([request])
}
