const https = require('https')


export const ViewTransaction = () => { 

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
}

export default ViewTransaction;

curl http://localhost:8899 -X POST -H "Content-Type: application/json" -d '         
  {                                                                                 
    "jsonrpc": "2.0",                                                               
    "id": 1,                                                                        
    "method": "getTransaction",                                                     
    "params": [                                                                     
      "4BQnUBcVXzZE2bubj4UcWYJgF9oWzRCuZncyoGrs1vV6dBu2CXYdTPUZ2CQAMia6BoXJ8hKQjDMYtPh5Ekyh5YL5",    
      "json"                                                                        
    ]                                                                               
  }                                                                                 
' 
