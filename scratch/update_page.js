const fs = require('fs');

const pageFile = 'c:/Users/Dell/Music/mit-paradh-main/src/app/student/dashboard/page.tsx';
let content = fs.readFileSync(pageFile, 'utf8');

if (!content.includes('import StudentNoticeBoard')) {
    content = content.replace(
        "import ApplicationPreviewModal from '@/components/ApplicationPreviewModal';",
        "import ApplicationPreviewModal from '@/components/ApplicationPreviewModal';\nimport StudentNoticeBoard from '@/components/StudentNoticeBoard';"
    );
}

if (!content.includes('case 10:') && !content.includes('<StudentNoticeBoard')) {
    const switchDefaultRegex = /default:\s*return null;\s*\}\s*\};\s*const renderDesktopContent =/m;
    const renderContentBlock = `      case 10:
        return (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <StudentNoticeBoard collegeId={userData?.profile?.collegeId} />
          </div>
        );
      default:`;
    
    // Replace the default switch case in the render method
    content = content.replace(/default:\s*return null;\s*\}/, renderContentBlock + '\n        return null;\n    }');
}

fs.writeFileSync(pageFile, content);
console.log('Successfully updated page.tsx');
