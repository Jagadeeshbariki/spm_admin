const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');
const sourceFile = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function visit(node) {
    if (node.kind === ts.SyntaxKind.JsxExpression) {
        // console.log("Found JSX Expression");
    }
    ts.forEachChild(node, visit);
}

visit(sourceFile);
console.log("TS Parse complete.");
