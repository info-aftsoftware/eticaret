import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jsonLdHtml } from '../../lib/seo/json-ld'

test('JSON-LD: panelden gelen "</script>" betik etiketini kapatamaz, JSON değeri aynı kalır', () => {
  const sep = String.fromCharCode(0x2028)
  const data = { name: `X</script><script>alert(1)</script> & <!-- ${sep}`, price: 1 }
  const html = jsonLdHtml(data)
  assert.ok(!/[<>&]/.test(html))
  assert.ok(!html.includes(sep))
  assert.deepEqual(JSON.parse(html), data)
})
