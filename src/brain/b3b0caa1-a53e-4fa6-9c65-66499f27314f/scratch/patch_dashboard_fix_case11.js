const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'student', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the corrupted end of Case 11
const brokenPattern = /return \(\s+<div key=\{idx\} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group transition-all hover:border-\[#00a5a5\]">[\s\S]+?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+\);\s+return \(\s+<div className="text-center py-20 px-10 glass-effect rounded-\[3rem\] border border-white shadow-2xl">/;

// I'll use a simpler search since the above is complex
const mapEndPart = '                      </div>\n                    );\n        return (\n          <div className="text-center py-20 px-10 glass-effect rounded-[3rem] border border-white shadow-2xl">';

if (content.includes(mapEndPart)) {
    const fix = `                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-20 px-10 glass-effect rounded-[3rem] border border-white shadow-2xl">`;
    content = content.replace(mapEndPart, fix);
    console.log('Fixed Case 11 structure');
} else {
    // Try another pattern if the indentation is different
    const mapEndPart2 = '                      </div>\r\n                    );\r\n        return (\r\n          <div className="text-center py-20 px-10 glass-effect rounded-[3rem] border border-white shadow-2xl">';
    if (content.includes(mapEndPart2)) {
         const fix = `                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-20 px-10 glass-effect rounded-[3rem] border border-white shadow-2xl">`;
        content = content.replace(mapEndPart2, fix);
        console.log('Fixed Case 11 structure (CRLF)');
    } else {
        console.log('Could not find broken pattern for Case 11');
    }
}

fs.writeFileSync(filePath, content);
