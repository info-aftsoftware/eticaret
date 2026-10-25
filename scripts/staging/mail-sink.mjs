/**
 * Yerel staging için posta yakalayıcı (madde 28): uygulamanın SMTP ile gönderdiği her e-postayı dışarı çıkarmadan
 * .eml dosyası olarak klasöre yazar. STARTTLS sunmaz; AUTH PLAIN/LOGIN her kimliği kabul eder.
 *   node scripts/staging/mail-sink.mjs <klasör> [port=2525]
 */
import net from 'node:net'
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
const port = Number(process.argv[3] || 2525)
if (!dir) {
  console.error('Kullanım: node scripts/staging/mail-sink.mjs <klasör> [port]')
  process.exit(1)
}
fs.mkdirSync(dir, { recursive: true })
let seq = 0

net
  .createServer((sock) => {
    let buf = ''
    let inData = false
    let authStep = 0
    let from = ''
    const rcpt = []
    let data = []
    const send = (line) => sock.write(line + '\r\n')
    send('220 mail-sink ESMTP')
    sock.on('data', (chunk) => {
      buf += chunk.toString('utf8')
      let i
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i)
        buf = buf.slice(i + 2)
        if (inData) {
          if (line === '.') {
            inData = false
            seq += 1
            const file = path.join(dir, `${Date.now()}-${String(seq).padStart(4, '0')}.eml`)
            const head = `X-Sink-From: ${from}\r\nX-Sink-To: ${rcpt.join(', ')}\r\n`
            fs.writeFileSync(file, head + data.map((l) => (l.startsWith('..') ? l.slice(1) : l)).join('\r\n'))
            console.log(`posta ${seq}: ${from} -> ${rcpt.join(', ')}`)
            data = []
            rcpt.length = 0
            send('250 OK kaydedildi')
          } else data.push(line)
          continue
        }
        if (authStep === 1) { authStep = 2; send('334 UGFzc3dvcmQ6'); continue }
        if (authStep === 2) { authStep = 0; send('235 Kimlik kabul'); continue }
        const cmd = line.slice(0, 4).toUpperCase()
        if (cmd === 'EHLO') { send('250-mail-sink'); send('250-AUTH PLAIN LOGIN'); send('250 8BITMIME') }
        else if (cmd === 'HELO') send('250 mail-sink')
        else if (cmd === 'AUTH') {
          if (/^AUTH LOGIN\s*$/i.test(line)) { authStep = 1; send('334 VXNlcm5hbWU6') }
          else if (/^AUTH LOGIN \S+/i.test(line)) { authStep = 2; send('334 UGFzc3dvcmQ6') }
          else send('235 Kimlik kabul')
        } else if (cmd === 'MAIL') { from = (line.match(/<([^>]*)>/) || [])[1] || ''; send('250 OK') }
        else if (cmd === 'RCPT') { rcpt.push((line.match(/<([^>]*)>/) || [])[1] || ''); send('250 OK') }
        else if (cmd === 'DATA') { inData = true; send('354 Veri bekleniyor') }
        else if (cmd === 'RSET') { rcpt.length = 0; data = []; send('250 OK') }
        else if (cmd === 'NOOP') send('250 OK')
        else if (cmd === 'QUIT') { send('221 Hoşça kal'); sock.end() }
        else send('502 Desteklenmiyor')
      }
    })
    sock.on('error', () => {})
  })
  .listen(port, '127.0.0.1', () => console.log(`mail-sink 127.0.0.1:${port} -> ${dir}`))
