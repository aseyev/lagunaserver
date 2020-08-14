const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('test lagunaserver!');
});

app.listen(3000, () => console.log('test server listening on port 3000!'));