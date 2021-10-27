curl http://localhost:8899 -X POST -H "Content-Type: application/json" -d '         
  {"jsonrpc":"2.0", "id":1, "method":"getTokenAccountBalance", "params": ["CDsc9SCGUpEHo5VUFXbzFbS2hVF9jnQsXk7FQBB7PHE8"]}
'  


const https = require('https')

const data = new TextEncoder().encode(
  JSON.stringify({
    todo: 'Buy the milk 🍼'
  })
)

const options = {
  hostname: 'whatever.com',
  port: 443,
  path: '/todos',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', d => {
    process.stdout.write(d)
  })
})

req.on('error', error => {
  console.error(error)
})

req.write(data)
req.end()

