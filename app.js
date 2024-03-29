const express = require('express');
const volleyball = require('volleyball');
const cors = require('cors');

const app = express();

const auth = require('./auth/index');
//const crash = require('./api/crash');

const middlewares = require('./auth/middleware');

app.use(volleyball);
app.use(cors({
    origin: '*'
}));
app.use(express.json());

app.use(middlewares.checkTokenSetUser);

app.get('/', (req, res) => {
   res.json({
       message: 'Hello World!',
       user: req.user,
   })
});

app.use('/auth', auth);
//app.use('/api/v1/crash', crash);

function notFound(req, res, next) {
    res.status(404);
    const error = new Error('Not Found - ' + req.originalUrl);
    next(error);
}

function errorHandler(err, req, res, next) {
    res.status(res.statusCode || 500);
    res.json({
        message: err.message,
        stack: err.stack
    });
}

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log('Listening on port', port);
});