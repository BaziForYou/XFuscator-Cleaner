const luamin = require('lua-format')
const fs = require('fs');
if (!fs.existsSync('input.lua')) {
    console.log("input.lua not found!")
    process.exit(1)
}
const Code = fs.readFileSync('input.lua', 'utf8');
const beautified = luamin.Beautify(Code, {RenameVariables: true, RenameGlobals: false, SolveMath: false});
let finalCode = "-- Cleaned Using https://github.com/BaziForYou/XFuscator-Cleaner\n"
let Variables = {}

function size_dict(d){c=0; for (i in d) ++c; return c}

for (let line of beautified.split("\n")) {
   if (line.includes("local L_1_ = {")) {
    line = line.replace("local L_1_ = {", "").slice(0, -3)
    const variables = line.split(",[")
    for (const variable of variables) {
        const name = variable.split(" = ")[0].replace("[", "").replace("]", "")
        const value = variable.split(" = ")[1]
        Variables[name] = value
    }
   } else if (size_dict(Variables) > 0) {
        while (line.includes("L_1_")) {
            const variableNumber = line.split("L_1_[")[1].split("]")[0]
            line = line.replace("L_1_[" + variableNumber + "]", Variables[`${variableNumber}`])
        }
        finalCode += line + "\n"
   }
}

fs.writeFileSync('output.lua', finalCode, 'utf8');
console.log("Done! cleaned file now saved inside output.lua")