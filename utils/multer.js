const multer = require("multer");
const path=require('path')


module.exports = multer({
    storage:multer.diskStorage({}),
    fileFilter : (req,file,cb)=>{
        let ext = path.extname(file.originalname);
        if(ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png'){
            cb(new Error('file type is not supported'),false)
            return
        }
        cb(null,true)
    },
})


// const storage = multer.diskStorage({
//     filename: (req, file, cb) => {
//     cb(null, file.originalname);
//   },
// });

// module.exports = {
//   uploads: multer({ storage: storage }).array('Image',4)
//   };
