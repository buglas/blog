const fs=require('fs')

fs.writeFile('./menu/mds.json','[]',function(err){
    if(err){console.error(err)}
    console.log('----------mds新增成功-------------');
})
fs.writeFile('./menu/st.json','[]',function(err){
    if(err){console.error(err)}
    console.log('----------st新增成功-------------');
})

