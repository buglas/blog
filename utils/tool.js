const fs=require('fs')

/*当前文件运行时的时间戳*/
const stamp=new Date().getTime();
/*方法工具
*   getFiles() 获取目录中的所有文件信息，并根据文件类型，将其分为静态文件和md文件两类
*       path 文件路径
*       folder 文件所在的文件夹
*       name 文件名
*       type 文件类型
*       ossName 文件在oss中的线上名称
*       mtime 修改时间
*       ctime 创建时间，初始为修改时间
*   getRandom() 基于时间戳和随机数，获取一个基本不会重复的数值
* */
const tool={
    getFiles(path=''){
        const files={mds:[],st:[]};
        readFolder(path);
        files.mds.sort((a,b)=>{
            return a.ctime<b.ctime?1:-1;
        })
        return files;
        function readFolder(path,folder,name=''){
            let stat=fs.statSync(path);
            if (stat.isDirectory()){
                let files=fs.readdirSync(path);
                for (let ele of files){
                    readFolder(`${path}/${ele}`,path,ele);
                }
            }else{
                const type=path.split('.').pop();
                const mtime=stat.mtime.getTime();
                const file={
                    path,
                    folder,
                    name,
                    type,
                    ossName:tool.getRandom()+'.'+type,
                    mtime,
                    ctime:mtime
                }
                if(type==='md'){
                    files.mds.push(file);
                }else if(type!=='DS_Store'){
                    files.st.push(file);
                }
            }
        }
    },
    getRandom(){
        return stamp+Math.random().toString().split('.')[1];
    }
}
module.exports = tool;
