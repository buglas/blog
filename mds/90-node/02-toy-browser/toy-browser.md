## 前言

最近winter大神在组织内训，是关于toy-browser的。

我当前对toy-browser 的认知就是：用node建立一个后端服务，再用node建立一个用户端，在用户端里向后端发出请求。



## 第一章 toy-browser 初试

  1.先建立一个后端服务 server.js   

```js
// 导入http模块:
var http = require("http"); //http 模块

// 创建http server，并传入回调函数:
var server = http.createServer(function(request, response) {
  let body = [];
  request
    .on("error", (err) => {
      console.error('----err：');
      console.error(err);
    })
    .on("data", (chunk) => {
      console.log('----data：');
      console.log(chunk.toString());
      body.push(chunk.toString());
    })
    .on("end", () => {
      console.log('----end');
      body = body.join("");
      response.writeHead(200, {"Content-Type": "text-html"});
      response.end("666666");
    });
});

// 让服务器监听8080端口:
server.listen(8080);

console.log("Server is running at http://127.0.0.1:8080/");
```



2.建立一个用户端client.js，向刚才的后端发起请求

```js
const net = require("net");

const client = net.createConnection({port: 8080}, () => {
    client.write(`POST / HTTP/1.1\r
HOST: 127.0.0.1\r
Content-Type: application/x-www-form-urlencoded\r
Content-Length: 3\r
\r
a=1\r\n`);
    console.log("----已连接服务器");
    client.write("world!\r\n");
});
client.on("data", (data) => {
    console.log('----data数据:');
    console.log(data.toString());
    client.end();
});
client.on("end", () => {
    console.log("----已经与服务器断开");
});

```

当前的请求端口、请求方法、请求协议、协议版本、数据类型、数据长度、数据内容都是写死的。

接下来我们将其写活。



## 第二章 toy-browser 模块化

接下来



















