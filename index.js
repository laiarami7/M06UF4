




const PORT=7777;


let static = require('node-static');
 
let file = new static.Server('./public');
 
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(PORT);
