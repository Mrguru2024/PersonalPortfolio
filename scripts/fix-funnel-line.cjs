const fs = require("fs");
const path = "app/admin/funnel/page.tsx";
let s = fs.readFileSync(path, "utf8");
// Remove leftover: .'s or .'s (Unicode U+2019) plus spaces before </p>
s = s.replace(/\.([\u2019'])s\s+<\/p>/, ".</p>");
fs.writeFileSync(path, s);
console.log("Done");
