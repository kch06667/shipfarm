const fs=require('node:fs');
const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
module.exports={executablePath,headless:true,args:['--no-sandbox']};
