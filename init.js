const fs=require('fs')

fs.writeFile('./mds.json','[]',function(err){
    if(err){console.error(err)}
    console.log('----------mds新增成功-------------');
})
fs.writeFile('./st.json','[]',function(err){
    if(err){console.error(err)}
    console.log('----------st新增成功-------------');
})

