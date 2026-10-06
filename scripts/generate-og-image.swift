import AppKit

let W = 1200.0
let H = 630.0

guard let image = NSImage(contentsOfFile: "public/fotos/dbca.webp") else {
    print("ERROR: no se pudo cargar el logo")
    exit(1)
}

let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: Int(W),
    pixelsHigh: Int(H),
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
)!

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

// Fondo degradado
let gradient = NSGradient(colors: [
    NSColor(srgbRed: 0.0, green: 0.12, blue: 0.25, alpha: 1.0),
    NSColor(srgbRed: 0.0, green: 0.24, blue: 0.42, alpha: 1.0),
])!
gradient.draw(in: NSRect(x: 0, y: 0, width: W, height: H), angle: -90)

// Sombra suave detrás del logo
let shadow = NSShadow()
shadow.shadowColor = NSColor.black.withAlphaComponent(0.5)
shadow.shadowBlurRadius = 30
shadow.set()

// Logo centrado
let logoSize = 340.0
let logoRect = NSRect(
    x: (W - logoSize) / 2,
    y: (H - logoSize) / 2 + 40,
    width: logoSize,
    height: logoSize
)
image.draw(in: logoRect)

NSGraphicsContext.current?.restoreGraphicsState()

// Título
let title = "DE BELINGO CON ÁNGEL" as NSString
let titleFont = NSFont(name: "AvenirNext-DemiBold", size: 62) ?? NSFont.boldSystemFont(ofSize: 62)
let titleShadow = NSShadow()
titleShadow.shadowColor = NSColor.black.withAlphaComponent(0.6)
titleShadow.shadowBlurRadius = 12
titleShadow.shadowOffset = NSSize(width: 0, height: -3)
let titleAttrs: [NSAttributedString.Key: Any] = [
    .font: titleFont,
    .foregroundColor: NSColor.white,
    .shadow: titleShadow,
]
let titleSize = title.size(withAttributes: titleAttrs)
title.draw(
    at: NSPoint(x: (W - titleSize.width) / 2, y: 150),
    withAttributes: titleAttrs
)

// Subtítulo
let subtitle = "Verbenas en Tenerife" as NSString
let subtitleFont = NSFont(name: "AvenirNext-Medium", size: 38) ?? NSFont.systemFont(ofSize: 38)
let subtitleAttrs: [NSAttributedString.Key: Any] = [
    .font: subtitleFont,
    .foregroundColor: NSColor(red: 0.55, green: 0.75, blue: 1.0, alpha: 1.0),
]
let subtitleSize = subtitle.size(withAttributes: subtitleAttrs)
subtitle.draw(
    at: NSPoint(x: (W - subtitleSize.width) / 2, y: 92),
    withAttributes: subtitleAttrs
)

guard let png = bitmap.representation(using: .png, properties: [:]) else {
    print("ERROR: no se pudo exportar PNG")
    exit(1)
}

let out = "public/fotos/og-image.png"
try! png.write(to: URL(fileURLWithPath: out))
print("OK: \(out)")
