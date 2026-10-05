import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Printable poster with a QR code that opens the Gratitude Wall on this site
export function QrPoster() {
  const url = `${window.location.origin}/#/gratitude`
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(url, { width: 1000, margin: 1, errorCorrectionLevel: 'H', color: { dark: '#0b0b0e', light: '#ffffff' } }).then(setSrc)
  }, [url])

  return (
    <section className="qr-page">
      <div className="qr-poster">
        <img className="qr-logo" src="/logo.png" alt="The Extra Mile" />
        <p className="qr-eyebrow">Customer Service Week 2026</p>
        <h1>Say <em>Thank You</em></h1>
        <p className="qr-lead">Appreciate a colleague who went the extra mile.</p>
        <div className="qr-frame">
          {src && <img className="qr-code" src={src} alt={`QR code to ${url}`} />}
          <span className="qr-badge"><img src="/logo.png" alt="" /></span>
        </div>
        <p className="qr-scan">📱 Scan with your phone camera</p>
        <p className="qr-url">{url.replace(/^https?:\/\//, '')}</p>
        <div className="qr-foot">💌 Gratitude Wall · #TheExtraMile</div>
      </div>
    </section>
  )
}
