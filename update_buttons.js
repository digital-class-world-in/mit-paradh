const fs = require('fs');
const file = 'e:/Digital Class/MIT/src/components/ProfileWizard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace {loading ? 'Saving...' : 'Save & Next'} with
// {formData.profileLocked ? 'Next' : (loading ? 'Saving...' : 'Save & Next')}
content = content.replace(
    /\{loading \? 'Saving\.\.\.' : 'Save \& Next'\}/g,
    "{formData.profileLocked ? 'Next' : (loading ? 'Saving...' : 'Save & Next')}"
);

// We need to disable or hide the Reset button
// The reset button code: onClick={() => setFormData({})}
// Let's replace onClick={() => setFormData({})} with 
// onClick={() => setFormData({})} disabled={formData.profileLocked}
content = content.replace(
    /onClick=\{\(\) => setFormData\(\{\}\)\}/g,
    "onClick={() => !formData.profileLocked && setFormData({})} className={formData.profileLocked ? 'hidden' : ''} "
);

fs.writeFileSync(file, content);
console.log('Buttons updated!');
