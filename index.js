const luamin = require('lua-format')
const fs = require('fs');
const inputFile = process.argv[2] !== undefined ? process.argv[2] : "input.lua";
let fileExtension = inputFile.split('.').pop();
let fileAddress = inputFile.split('\\');
fileAddress.pop();
fileAddress = fileAddress[0] !== undefined ? fileAddress.join('\\') : ".";
const lastFile = inputFile.split('\\').pop();
console.log(`Input file: ${lastFile}`);
if (!fs.existsSync(inputFile)) {
    console.log(`${lastFile} not found!`)
    process.exit(1)
}
let Code = fs.readFileSync(inputFile, 'utf8');

function deobfuscate(code) { // thanks to https://github.com/lilabyte/fivem-deXFuscator i just used this logic and made it work with my cleaner
    let patterns = [
        `local __ =`,
        `local ____________________________________________________________________________________________________ =`,
        `XFU5K470R 15 4W350M3. KR3D17 70 XFU5K470R!"}`
    ];
    let foundRightDivider = false;
    let divider = 1;
    let obfuscatedArray = code.substring((code.indexOf(patterns[0]) >= 0) ? code.indexOf(patterns[0]) + patterns[0].length : code.indexOf(patterns[1]) + patterns[1].length).trim();
    obfuscatedArray = obfuscatedArray.substring(0, obfuscatedArray.indexOf(`}`) + 1);
    obfuscatedArray = obfuscatedArray.replace(`, }`, `}`);
    obfuscatedArray = JSON.parse(obfuscatedArray.replace(`{`, `[`).replace(`}`, `]`).replace(/(_|\(|\))/g, ``));
    while (!foundRightDivider) {
        let deobfuscated = obfuscatedArray.map(function (char) {
            return String.fromCharCode(char/divider);
        }).join('').replace(/[^A-Za-z 0-9 \s\.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
        if (deobfuscated.includes(`local`)) {
            deobfuscated = deobfuscated.replace(`LuaQ`, ``);
            deobfuscated = deobfuscated.replace(`LuaS`, ``);
            deobfuscated = deobfuscated.split("\n");
            return deobfuscated[0];
        }
        divider += 1;
    }
}

const Sign = "-- Cleaned Using https://github.com/BaziForYou/XFuscator-Cleaner\n"
if (Code.trim().startsWith("math.randomseed")) {
    console.log("File is obfuscated! Deobfuscating ...")
    Code = deobfuscate(Code)
    fs.writeFileSync(`${fileAddress}\\${lastFile.split('.')[0]}_Deobfuscated.${fileExtension}`, Sign + Code, 'utf8');
    console.log(`Deobfuscated output saved to ${fileAddress}\\${lastFile.split('.')[0]}_Deobfuscated.${fileExtension}`)
}

console.log("Cleaning deobfuscated file...")
const beautified = luamin.Beautify(Code, {RenameVariables: true, RenameGlobals: false, SolveMath: false});
console.log("Cleaned going to clean variables...")
let finalCode = Sign
let Variables = {}
let mainTableName = ""
let variableFinding = false

function size_dict(d){c=0; for (i in d) ++c; return c}

for (let line of beautified.split("\n")) {
   if (line.includes(` = {`) && mainTableName == "") {
    mainTableName = line.replace("local ", "").split(" = ")[0]
    console.log(`Found main table! Name: ${mainTableName}`)
    line = line.replace("local ", "").replace(`${mainTableName} = {`, "").slice(0, -3)
    let variables = line.split(",[")
    if (variables.length == 1 && variables[0] == "") {
        variableFinding = true
    } else {
        console.log(`Found ${variables.length} variables inside main table! Method: 1`)
        for (const variable of variables) {
            const name = variable.split(" = ")[0].replace("[", "").replace("]", "")
            const value = variable.split(" = ")[1]
            if (value.includes(`"`) && value.includes(`\\`)) {
                const finalValue = value.slice(1, -1).split("\\").map(Number).map(x => {
                    const Converted = String.fromCharCode(x)
                    if (Converted.includes(`\\`)) {
                        return `\\\\`
                    } else if (Converted.includes(`"`)) {
                        return `\\"`
                    } else if (Converted.includes(`'`)) {
                        return `\\'`
                    } else if (Converted.includes(`\n`)) {
                        return `\\n`
                    } else if (Converted.includes(`\r`)) {
                        return `\\r`
                    } else if (Converted.includes(`\t`)) {
                        return `\\t`
                    } else if (Converted.includes(`\v`)) {
                        return `\\v`
                    } else {
                        return Converted
                    }
                }).join("").substring(1)
                Variables[name] = `"${finalValue}"`
            } else {
                Variables[name] = value
            }
        }
    }
   } else if (variableFinding) {
        if (line.includes(`}`)) {
            variableFinding = false
            console.log(`Found ${size_dict(Variables)} variables inside main table! Method: 2`)
        } else {
            const name = line.split(" = ")[0].replace("[", "").replace("]", "").trim()
            const value = line.split(" = ")[1]
            if (value.includes(`"`) && value.includes(`\\`)) {
                const finalValue = value.replace(new RegExp(`"`, "g"),``).replace(new RegExp(`,`, "g"),``).split("\\").map(x => {
                    const Converted = String.fromCharCode(x)
                    if (Converted.includes(`\\`)) {
                        return `\\\\`
                    } else if (Converted.includes(`"`)) {
                        return `\\"`
                    } else if (Converted.includes(`'`)) {
                        return `\\'`
                    } else if (Converted.includes(`\n`)) {
                        return `\\n`
                    } else if (Converted.includes(`\r`)) {
                        return `\\r`
                    } else if (Converted.includes(`\t`)) {
                        return `\\t`
                    } else if (Converted.includes(`\v`)) {
                        return `\\v`
                    } else {
                        return Converted
                    }
                }).join("").substring(1)
                Variables[name] = `"${finalValue}"`
            } else {
                Variables[name] = value.replace(new RegExp(`,`, "g"),``)
            }
        }
   } else if (size_dict(Variables) > 0) {
        while (line.includes(mainTableName)) {
            const variableNumber = line.split(`${mainTableName}[`)[1].split("]")[0]
            line = line.replace(`${mainTableName}[${variableNumber}]`, Variables[`${variableNumber}`])
        }
        finalCode += line + "\n"
   }
}
console.log("Cleaning finished!")
const finalCodeBeautified = luamin.Beautify(finalCode, {RenameVariables: false, RenameGlobals: false, SolveMath: true}).split("\n").slice(4).join("\n")
fs.writeFileSync(`${fileAddress}\\${lastFile.split('.')[0]}_finalOutput.${fileExtension}`, finalCodeBeautified, 'utf8');
console.log(`Done! cleaned file now saved inside ${fileAddress}\\${lastFile.split('.')[0]}_finalOutput.${fileExtension}`)