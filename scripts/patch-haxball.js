const fs = require("fs");
const path = require("path");

const haxballFile = path.resolve(__dirname, "../node_modules/haxball.js/src/index.js");
let code = fs.readFileSync(haxballFile, "utf8");
let patched = code.replace(
  'if(F.Ff)throw r.s("Can\'t init twice");F.Ff=',
  '// [patch] multi-room support; F.Ff = '
);
patched = patched.replace(
  'setInterval(function(){D.Ba()},50);',
  'setInterval(function(){try{D.Ba()}catch(e){}},50);'
);
fs.writeFileSync(haxballFile, patched, "utf8");

const extendedRoomFile = path.resolve(__dirname, "../node_modules/haxball-extended-room/dist/Room.js");
code = fs.readFileSync(extendedRoomFile, "utf8");
patched = code.replace(
  "const commands = Reflect.getMetadata('her:commands', Module.prototype) || [];\n        const events = Reflect.getMetadata('her:events', Module.prototype) || [];\n        let customEvents = Reflect.getMetadata('her:custom_events', Module.prototype) || [];",
  "const commands = (Reflect.getMetadata('her:commands', Module.prototype) || []).map(c => ({ ...c }));\n        const events = (Reflect.getMetadata('her:events', Module.prototype) || []).map(e => ({ ...e }));\n        let customEvents = (Reflect.getMetadata('her:custom_events', Module.prototype) || []).map(e => ({ ...e }));"
);
fs.writeFileSync(extendedRoomFile, patched, "utf8");

console.log("OK haxball.js patched for multi-room + DataChannel error handling");
console.log("OK haxball-extended-room patched for isolated module handlers");
