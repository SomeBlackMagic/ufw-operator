// import * as console from "console";
// import * as process from "process";
//
// const proxy = require('koa-better-http-proxy');
// const Koa = require('koa');
// const fs = require('fs')
// const http = require('http')
//
// console.log('Load config file')
// if(process.env.KUBERNETES_SERVICE_HOST !== 'undefined' && process.env.KUBERNETES_SERVICE_PORT !== 'undefined'){
//     console.log('Env is k8s');
//     const bearerToken = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf-8')
//     var req = http.request({
//         protocol: 'http:',
//         host: process.env.KUBERNETES_SERVICE_HOST,
//         port: process.env.KUBERNETES_SERVICE_PORT,
//         method: 'GET',
//         path: '/api/v1/namespaces?watch=true',
//         headers: {
//             Authorization: 'Bearer ' + K8S_SECRET
//         }
//     }, (res) => {
//         console.log('Watching namespace events...')
//
//         res.setEncoding('utf8')
//
//         res.on('data', (chunk) => {
//             const rawEvents = chunk.split('\n')
//
//             rawEvents.forEach(function (rawEvent) {
//                 if (rawEvent.length > 0) {
//                     const event = JSON.parse(rawEvent)
//                     console.log('    %s was %s', event.object.metadata.name, event.type.charAt(0) + event.type.substring(1).toLowerCase())
//                 }
//             })
//         })
//
//         res.on('end', () => {
//             console.log('  Event stream closed...')
//         })
//     })
//
//     req.on('error', (err) => {
//         console.log('Problem with request: %s', err.message)
//     });
//
//     req.end()
//
// } else {
//     console.log('No set!');
// }
//
//
// const app = new Koa();
// app.use(proxy('127.0.0.1:3002', {
//     filter: function(ctx) {
//         return ;
//     },
//     proxyReqBodyDecorator: function(bodyContent, ctx) {
//         if (ctx.request.url === '/') {
//
//         }
//         let a = JSON.parse(bodyContent.toString())
//         a.password = "12423452345"
//         console.log(a);
//         return JSON.stringify(a);
//     }
// }));
// app.listen(3001)
//
// //
// //