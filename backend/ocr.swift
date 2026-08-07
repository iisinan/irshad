import Foundation
import Vision
import PDFKit

let args = CommandLine.arguments
if args.count < 2 {
    print("Usage: ocr.swift <pdf_path>")
    exit(1)
}

let pdfPath = args[1]
let url = URL(fileURLWithPath: pdfPath)
guard let document = PDFDocument(url: url) else {
    print("Failed to open PDF")
    exit(1)
}

for i in 0..<min(6, document.pageCount) {
    guard let page = document.page(at: i) else { continue }
    let pageRect = page.bounds(for: .mediaBox)
    let renderer = UIGraphicsImageRenderer(size: pageRect.size)
    // Wait, UIGraphicsImageRenderer is UIKit (iOS). On macOS we use NSImage
    // Let's use CoreGraphics directly to draw the PDF page into a CGImage
}
