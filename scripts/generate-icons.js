const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function makeCRCTable() {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[n] = c
  }
  return table
}
const CRC_TABLE = makeCRCTable()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF]
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function makePNG(w, h, bg, fg, letter) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(w, 0)
  ihdrData.writeUInt32BE(h, 4)
  ihdrData[8] = 8; ihdrData[9] = 2 // RGB

  // Draw: gold background + dark center square with "M" feel
  const rows = []
  const cx = w / 2, cy = h / 2
  const r = w * 0.35

  for (let y = 0; y < h; y++) {
    const row = [0] // filter byte
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < r) {
        row.push(fg[0], fg[1], fg[2])
      } else {
        row.push(bg[0], bg[1], bg[2])
      }
    }
    rows.push(Buffer.from(row))
  }

  const raw = Buffer.concat(rows)
  const idat = chunk('IDAT', zlib.deflateSync(raw))
  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, chunk('IHDR', ihdrData), idat, iend])
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(iconsDir, { recursive: true })

// gold = #C9A84C, black = #0A0A0A
const gold = [201, 168, 76]
const black = [10, 10, 10]

const sizes = [
  { name: 'icon-192.png', w: 192, h: 192 },
  { name: 'icon-512.png', w: 512, h: 512 },
  { name: 'apple-touch-icon.png', w: 180, h: 180 },
]

for (const { name, w, h } of sizes) {
  const png = makePNG(w, h, black, gold, 'M')
  fs.writeFileSync(path.join(iconsDir, name), png)
  console.log(`✓ ${name} (${w}x${h})`)
}
