module.exports=function(accessKeyId='',accessKeySecret=''){
    return {
        "enter": "./mds",
        "out": "./dist",
        "menu": {
            "st":"./menu/st.json",
            "mds":"./menu/mds.json"
        },
        "ossPathSt": "https://blog-st.oss-cn-beijing.aliyuncs.com/",
        "ossPathMds": "https://blog-mds.oss-cn-beijing.aliyuncs.com/",
        "bucketSt": {
            "region": "oss-cn-beijing",
            "accessKeyId": accessKeyId,
            "accessKeySecret": accessKeySecret,
            "endPoint": "oss-cn-beijing.aliyuncs.com",
            "bucket": "blog-st"
        },
        "bucketMds": {
            "region": "oss-cn-beijing",
            "accessKeyId": accessKeyId,
            "accessKeySecret": accessKeySecret,
            "endPoint": "oss-cn-beijing.aliyuncs.com",
            "bucket": "blog-mds"
        }
    }
}
