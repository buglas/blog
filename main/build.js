/*
* fs node内置文件系统
* tool 方法工具
* conf 配置文件
*   enter 博客入口
*   out 博客出口，解析后的线上版md文件会发布到这里后，再上传到oss
*   menu 博客目录
*       st 静态资源目录
*       mds md文件目录
*   ossPathSt oss中存放静态资源的bucket路径
*   ossPathMds oss中存放md文件的bucket路径
*   bucketSt 存放静态资源的bucket配置参数，用于OSS用户端实例化
*   bucketMds 存放md文件的bucket配置参数，用于OSS用户端实例化
* OSS 阿里云的oss服务端接口对象
* mdsOld 上一次build生成的md文件目录
* stOld 上一次build生成的静态资源目录
* menuOld 整合上一次上一次build生成的目录
* menuNow 当前博客入口中的文件目录
* clients 基于bucket配置项，将存放两种资源的bucket实例化
* */
const fs=require('fs')
const tool=require('../utils/tool')

const access=require('./access')
const conf=require('./conf')(access.accessKeyId,access.accessKeySecret)
const OSS = require('ali-oss')
const mdsOld=require('../menu/mds')
const stOld=require('../menu/st')
const menuOld={mds:mdsOld,st:stOld};
const menuNow=tool.getFiles(conf.enter);
/*console.log('menuNow',menuNow.mds);
menuNow.mds.forEach(ele=>{
    console.log(ele.name);
})*/
const clients={
    st:new OSS(conf.bucketSt),
    mds:new OSS(conf.bucketMds)
}

/*update 更新博客入口中的文件*/
update();

/*update 更新博客入口中的文件
*   setFiles() 先将图片文件上传到oss，返回静态资源目录信息
*   setFiles() 再将md文件写入本地dist目录，在上传到oss，返回ms文件目录信息
*   writeMenu() 将静态目录信息和md目录信息分别写入相应本地json文件中，并上传到oss
* */
async function update(){
    const st=await setFiles('st');
    const stMenu=st||stOld;
    const mds=await setFiles('mds',stMenu);
    writeMenu('st',st);
    writeMenu('mds',mds);
}



/*setFiles 对博客入口中的文件进行增加、修改、提交、删除操作
*   getFilesState() 对新旧两种目录进行对比，返回目录状态信息，如所有已删除的文件、新增的文件、修改过的文件
*   若新旧目录一样，则返回null；否则：
*   updateFiles() 将新増和修改过的文件写入本地(仅限md文件)，并上传到oss
*   deleteFiles() 将已删除的文件从本地出口(只针对md文件)中删除，从oss中删除
*   返回最新的目录
* */
async function setFiles(mold,st){
    const filesOld=menuOld[mold];
    const filesNow=menuNow[mold];

    const {df,nf,uf,cf,menu,change}=getFilesState(filesNow,filesOld);
    if(!change){return null}
    const client=clients[mold];
    console.log(`------------${mold}--------------`);
    cf.length&&console.log('cf-新增文件',cf);
    uf.length&&console.log('uf-修改文件',uf);
    df.length&&console.log('df-移除文件',df);
    console.log('nf',nf);
    await updateFiles(mold,client,nf,st);
    await deleteFiles(mold,client,df);
    return menu;
}
/*将最新文件写入本地目录，上传oss*/
async function writeMenu(fileName='mds',data,ossFile=fileName+'.json'){
    if(data){
        if(fileName==='mds'){
            data.sort((a,b)=>{
                return a.ctime<b.ctime?1:-1;
            })
        }
        const localFile=conf.menu[fileName];
        writeFile(localFile,JSON.stringify(data),ossFile);
        try {
            await clients.mds.put(ossFile,localFile);
            console.log(`${ossFile} 文件oss上传成功！`);
        } catch (e) {
            console.error(`${ossFile} 文件oss上传失败:`,e);
        }
    }
}

/*updateFiles 遍历文件目录，将新増和修改过的文件写入本地(仅限md文件)，并上传到oss
* 如果是md文件
*   readFileSync() 基于文件路径读取相应的md文件内容
*   getUrls() 从md中获取所有图片文件的链接地址，并通过此链接获取此文件的oss端名称
*   compileMd() 解析md文件，将此文件的本地地址替换成oss端地址
*   writeFile() 将此文件发布到出口目录中
* 如果是图片文件
*   只获取文件的本地地址，以便后续操作
* 使用oss实例对象将文件上传到oss
* */
async function updateFiles(mold,client,nf,st){
    for(let file of nf){
        let localPath='';
        if(mold==='mds'){
            const md=fs.readFileSync(file.path).toString();
            const urls=getUrls(md,file.folder,st);
            const mdOss=compileMd(md,urls);
            localPath=conf.out+'/'+file.ossName;
            writeFile(localPath,mdOss,file.name);
        }else{
            localPath=file.path;
        }
        try {
            await client.put(file.ossName,localPath);
            console.log(`${file.name} 文件oss上传成功！`);
        } catch (e) {
            console.error(`${file.name} 文件oss上传失败:`,e);
            return;
        }
    }
}

/*deleteFiles() 遍历文件目录，将已删除的文件从本地出口(只针对md文件)中删除，从oss中删除
*   如果是md文件，将已删除的文件从本地出口中删除
*   将文件从oss中删除
* */
async function deleteFiles(mold,client,df){
    for(let file of df){
        if(mold==='mds'){
            const localPath=conf.out+'/'+file.ossName;
            fs.unlink(localPath, function(e) {
                if (e) {
                    console.error(`${localPath} 文件本地删除失败：`,e);
                    return;
                }
                console.log(`${localPath} 文件本地删除成功！`);
            });
        }
        try {
            let result = await client.delete(file.ossName);
            console.log(`${file.name} 文件oss删除成功`);
        } catch (e) {
            console.error(`${file.name} 文件oss删除失败:`,e);
            return;
        }
    }
}

/*获取文件状态
*   df:需删除的文件，旧文件里有，新文件里没有
*   cf:需新增的文件，旧文件里没有，新文件里有
*   uf:需更新的文件，新旧文件里都有，但是其发生了改变
*   nf：修改文件+新增文件
*   of：没有变化的文件
*   menu：最新目录
* */
function getFilesState(filesNow,filesOld){
    const df=[...filesOld];
    const cf=[];
    const uf=[];
    const of=[];
    let nf=[];
    let menu=[];
    for(let fileNow of filesNow) {
        const fileOld = getFile(fileNow.path, df);
        if(fileOld){
            const mtime=fileNow.mtime;
            if(fileOld.mtime!==mtime){
                Object.assign(fileNow,fileOld);
                fileNow.mtime=mtime;
                uf.push(fileNow);
            }else{
                of.push(fileOld);
            }
        }else{
            cf.push(fileNow)
        }
    }
    nf=[...uf,...cf];
    menu=[...of,...nf];
    return {
        uf,
        cf,
        df,
        of,
        nf,
        menu,
        change:uf.length||cf.length||df.length
    }
}

/*将文件写入本地*/
function writeFile(file,data,sucTip=''){
    try {
        fs.writeFileSync(file, data);
        console.log(`${sucTip} 文件本地写入成功！`);
    }catch (e) {
        console.error(`${sucTip} 文件本地写入失败：`,e);
    }
}

/*解析md文件，将此文件的本地地址替换成oss端地址*/
function compileMd(md,urls){
    urls.forEach(ele=>{
        const ossPath=conf.ossPathSt+ele.ossName;
        const reg=new RegExp(ele.url, 'gsm');
        md=md.replace(reg,ossPath);
    })
    return md;
}

/*查找所有的图片url，如从' ](images/img.jpg)'中提取'images/img.jpg'
* 排除没有.的链接、html链接
* */
function getUrls(md,folder,st){
    const reg = RegExp(/]\((.*?)\)/, 'gsm');
    if(!reg[Symbol.matchAll]){
        return [];
    }
    const iterator=reg[Symbol.matchAll](md);
    const urlSet=new Set();
    for(let ele of iterator){
        const url=ele[1];
        const str=url.split('/').pop();
        const suffix=str.split('.').pop().replace(/\s+/g,'');
        const b1=str.includes('.')
        const b2=suffix!=='html';
        const b3=b1&&b2;
        if(b3){
            const path=folder+'/'+ele[1];
            const ossName=getOssName(path,st);
            urlSet.add({
                url,
                path,
                ossName
            })
        }
    }
    return [...urlSet];
}

/*根据文件的本地路径，从相应目录中获取相应的oss路径*/
function getOssName(path,st){
    for(let file of st){
        if(file.path===path){
            return file.ossName;
        }
    }
}

/*根据文件的本地路径，从相应目录中获取获取文件，并将此文件从目录中删除*/
function getFile(path,files) {
    for(let i=0;i<files.length;i++){
        const file=files[i];
        if(file.path===path){
            files.splice(i,1)
            return file;
        }
    }
    return null;
}





