import {useEffect, useState, React} from "react"
import {Content} from "./Content.tsx"
import axios from "axios"


export default function PostForm() {
  const https = require('https');
  const [post, setPost] = useState({});
  const [sent, setSent] = useState(false);
  const [tx, setTx] = useState({});

const handleSubmit = (post) => {
  console.log("retrieving data for transaction id:", post.title);

 // const data = new TextEncoder().encode( JSON.stringify({
 //     "jsonrpc": "2.0",                                                               
 //     "id": 1,                                                                        
 //     "method": "getTransaction",                                                     
 //     "params": [                                                                     
 //       `${post.title}`,
 //       "json"                                                                        
 //     ]                                                                               
 //   })
 // )

  const data = `{
      "jsonrpc": "2.0",                                                               
      "id": 1,                                                                        
      "method": "getTransaction",                                                     
      "params": [                                                                     
        ${post.title},
        "json"                                                                        
      ]                                                                               
    }`
  

  axios.post('https://cors.io/?http://localhost:8899', data, 
  { headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  mode: 'cors',
  })
  .then(response => {
  this.setTx(response.data);
  this.setSent(true);
  });
      
}

  const submit = (e) => {
    e.preventDefault()
    handleSubmit(post)
  }

if(post.title && sent){
    return (
    <>
      <form onSubmit={submit}>
      <label>{post.content}</label>
        <input
         type="text"
         name="title"
         onChange={e => setPost({ ...post, title: e.target.value })}
        />
        <input
         type="submit"
        />
      </form>
      <div id="content">
        <Content message={tx}/> 
      </div>
      </>
    )
    } else {

    return (
    <>
      <form onSubmit={submit}>
        <input
         type="text"
         name="title"
         onChange={e => setPost({ ...post, title: e.target.value })}
        />
        <input
         type="submit"
        />
      </form>
      <div id="content">
      </div>
      </>
    )
  }
}
