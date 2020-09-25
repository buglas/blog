const fs=require('fs')
const OSS = require('ali-oss')
const access=require('./access')
const conf=require('./conf')(access.accessKeyId,access.accessKeySecret)

const clients={
    st:new OSS(conf.bucketSt),
    mds:new OSS(conf.bucketMds)
}

async function list(client) {
    try {
        // 不带任何参数，默认最多返回1000个文件。
        let result = await client.list();
        console.log('result.isTruncated',result.isTruncated);
        // 根据nextMarker继续列出文件。
        if (result.isTruncated) {
            result = await client.list({
                marker: result.nextMarker
            });
        }
        console.log(result);
        // 列举前缀为'my-'的文件。
        /*result = await client.list({
            prefix: 'my-'
        });
        console.log(result);
        // 列举前缀为'my-'且在'my-object'之后的文件。
        result = await client.list({
            prefix: 'my-',
            marker: 'my-object'
        });
        console.log(result);*/
    } catch (e) {
        console.log(e);
    }
}
list(clients.st);
