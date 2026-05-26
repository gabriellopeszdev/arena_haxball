const fs = require("fs");
const path = require("path");

const file = path.resolve(__dirname, "../node_modules/haxball.js/src/index.js");
let code = fs.readFileSync(file, "utf8");
let patched = code.replace(
  'if(F.Ff)throw r.s("Can\'t init twice");F.Ff=',
  '// [patch] multi-room support; F.Ff = '
);
patched = patched.replace(
  'setInterval(function(){D.Ba()},50);',
  'setInterval(function(){try{D.Ba()}catch(e){}},50);'
);
fs.writeFileSync(file, patched, "utf8");
console.log("✅ haxball.js patched for multi-room + DataChannel error handling");
