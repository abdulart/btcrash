const express = require('express');
const path = require('path');
const volleyball = require('volleyball');
const cors = require('cors');
const app = express();

app.use(volleyball);
app.use(cors({
    origin: '*'
}));

// Handle production
app.use(express.static(path.join(__dirname, 'public')));
app.get(/.*/, (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
    console.log('Listening on port', port);
});