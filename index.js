const express = require('express') //require : node_modules의 어딘가에서 가져옴
const app = express() //application 생성
const PORT = 4000;

function handleListening() {
    console.log(`Listening on : http://localhost:${PORT}`)
}

app.listen(PORT, handleListening);

/*app.get('/', function (req, res) {
    res.send('hello world')
})*/ 