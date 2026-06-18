import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const targetFiles = [
      'src/components/AdmissionInquiryManager.tsx',
      'src/components/WebsiteManager.tsx',
      'src/components/CollegeListManager.tsx',
      'src/components/ExamManager.tsx',
      'src/components/ExamFormManager.tsx',
      'src/components/ExamFeesManager.tsx',
      'src/components/CredentialManager.tsx',
      'src/components/AdminTrashManager.tsx',
      'src/components/ContactEnquiriesManager.tsx',
      'src/components/StaffRegistryManager.tsx',
      'src/components/TrashManager.tsx',
      'src/components/PaymentHistoryManager.tsx',
      'src/components/PaymentSettingsManager.tsx'
    ];

    const workspaceRoot = process.cwd();
    const results: string[] = [];

    for (const relPath of targetFiles) {
      const filePath = path.join(workspaceRoot, relPath);
      if (!fs.existsSync(filePath)) {
        results.push(`File not found: ${relPath}`);
        continue;
      }
      let content = fs.readFileSync(filePath, 'utf8');

      // 1. Add import if not present
      if (!content.includes('getDefaultAdminUid')) {
        content = `import { getDefaultAdminUid } from '@/lib/adminUtils';\n` + content;
      }

      // 2. Add props and helper function if not present
      if (!content.includes('getDbRef')) {
        const signatures = [
          {
            target: 'export default function WebsiteManager({ mode }: WebsiteManagerProps) {',
            replacement: 'export default function WebsiteManager({ mode, adminUid }: WebsiteManagerProps & { adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'const StaffRegistryManager = ({ collegeId }: StaffRegistryManagerProps) => {',
            replacement: 'const StaffRegistryManager = ({ collegeId, adminUid }: StaffRegistryManagerProps & { adminUid?: string }) => {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'export default function ExamManager({ collegeId, defaultCreate }: { collegeId: string | undefined, defaultCreate?: boolean }) {',
            replacement: 'export default function ExamManager({ collegeId, defaultCreate, adminUid }: { collegeId: string | undefined, defaultCreate?: boolean, adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'export default function ExamFormManager({ collegeId }: ExamFormManagerProps) {',
            replacement: 'export default function ExamFormManager({ collegeId, adminUid }: ExamFormManagerProps & { adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'export default function ExamFeesManager({ collegeId }: ExamFeesManagerProps) {',
            replacement: 'export default function ExamFeesManager({ collegeId, adminUid }: ExamFeesManagerProps & { adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'export default function CredentialManager({ collegeId, type }: CredentialManagerProps) {',
            replacement: 'export default function CredentialManager({ collegeId, type, adminUid }: CredentialManagerProps & { adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'export default function ContactEnquiriesManager() {',
            replacement: 'export default function ContactEnquiriesManager({ adminUid }: { adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'const AdminTrashManager = () => {',
            replacement: 'const AdminTrashManager = ({ adminUid }: { adminUid?: string }) => {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'const CollegeListManager = () => {',
            replacement: 'const CollegeListManager = ({ adminUid }: { adminUid?: string }) => {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
        },
          {
            target: 'export default function AdmissionInquiryManager({ collegeId, collegeName, mode = \'inquiry\', adminUid }: { collegeId: string | undefined, collegeName?: string, mode?: \'inquiry\' | \'list\' | \'cancelled\' | \'pending\', adminUid?: string }) {',
            replacement: 'export default function AdmissionInquiryManager({ collegeId, collegeName, mode = \'inquiry\', adminUid }: { collegeId: string | undefined, collegeName?: string, mode?: \'inquiry\' | \'list\' | \'cancelled\' | \'pending\', adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'export default function TrashManager({ collegeId }: { collegeId?: string }) {',
            replacement: 'export default function TrashManager({ collegeId, adminUid }: { collegeId?: string; adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'export default function PaymentHistoryManager({ collegeId }: { collegeId?: string }) {',
            replacement: 'export default function PaymentHistoryManager({ collegeId, adminUid }: { collegeId?: string; adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          },
          {
            target: 'export default function PaymentSettingsManager({ collegeId }: { collegeId?: string }) {',
            replacement: 'export default function PaymentSettingsManager({ collegeId, adminUid }: { collegeId?: string; adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };'
          }
        ];

        let replaced = false;
        for (const sig of signatures) {
          if (content.includes(sig.target)) {
            content = content.replace(sig.target, sig.replacement);
            replaced = true;
            break;
          }
        }
        if (!replaced) {
          results.push(`Could not find signature match for: ${relPath}`);
        }
      }

      // 3. Replace ref(realtimeDb, ...) with getDbRef(...)
      content = content.replace(/ref\(realtimeDb,\s*(`[^`]+`|'[^']+'|"[^"]+"|[a-zA-Z0-9_$.{}]+)\)/g, 'getDbRef($1)');

      fs.writeFileSync(filePath, content, 'utf8');
      results.push(`Successfully scoped: ${relPath}`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack });
  }
}
