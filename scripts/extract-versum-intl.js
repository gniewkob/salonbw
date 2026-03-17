const fs = require("fs");
const path = require("path");

const sourcePath = path.join(
    __dirname,
    "../apps/panel/public/versum-calendar/javascripts/new/pl-json-aed09af5e4c6d82e2886.js",
);
const destPath = path.join(__dirname, "../apps/panel/messages/pl.json");

function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
}

function mergeDeep(target, source) {
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return target;
}

console.log(`Wczytywanie pliku: ${sourcePath}`);
const content = fs.readFileSync(sourcePath, "utf8");

// Znajduje wszystkie ciągi znaków przekazywane do JSON.parse('...')
const regex = /JSON\.parse\(\s*('(?:[^'\\]|\\.)*')\s*\)/g;
let match;
const mergedData = {};

while ((match = regex.exec(content)) !== null) {
    try {
        // Używamy eval na samym wyciągniętym stringu (np. '{"foo": "bar"}'),
        // co natywnie i najbezpieczniej zdekoduje wszystkie znaki ucieczki JS (np. \', \\n)
        const jsonString = eval(match[1]);
        const parsed = JSON.parse(jsonString);

        mergeDeep(mergedData, parsed);
    } catch (e) {
        console.error("Błąd parsowania payloadu JSON:", e.message);
    }
}

fs.mkdirSync(path.dirname(destPath), { recursive: true });
fs.writeFileSync(destPath, JSON.stringify(mergedData, null, 2), "utf8");
console.log(`✅ Pomyślnie wyekstrahowano słownik do: ${destPath}`);
