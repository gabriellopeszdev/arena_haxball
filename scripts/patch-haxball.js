const fs = require("fs");
const path = require("path");

const file = path.resolve(__dirname, "../node_modules/haxball.js/src/index.js");
let code = fs.readFileSync(file, "utf8");
const patched = code.replace(
  'if(F.Ff)throw r.s("Can\'t init twice");F.Ff=',
  '// [patch] multi-room support; F.Ff = '
);
fs.writeFileSync(file, patched, "utf8");
console.log("✅ haxball.js patched for multi-room");
