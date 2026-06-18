import os
import re

targetFiles = [
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
]

signatures = [
  {
    "target": "export default function WebsiteManager({ mode }: WebsiteManagerProps) {",
    "replacement": "export default function WebsiteManager({ mode, adminUid }: WebsiteManagerProps & { adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "const StaffRegistryManager = ({ collegeId }: StaffRegistryManagerProps) => {",
    "replacement": "const StaffRegistryManager = ({ collegeId, adminUid }: StaffRegistryManagerProps & { adminUid?: string }) => {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "export default function ExamManager({ collegeId, defaultCreate }: { collegeId: string | undefined, defaultCreate?: boolean }) {",
    "replacement": "export default function ExamManager({ collegeId, defaultCreate, adminUid }: { collegeId: string | undefined, defaultCreate?: boolean, adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "export default function ExamFormManager({ collegeId }: ExamFormManagerProps) {",
    "replacement": "export default function ExamFormManager({ collegeId, adminUid }: ExamFormManagerProps & { adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "export default function ExamFeesManager({ collegeId }: ExamFeesManagerProps) {",
    "replacement": "export default function ExamFeesManager({ collegeId, adminUid }: ExamFeesManagerProps & { adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "export default function CredentialManager({ collegeId, type }: CredentialManagerProps) {",
    "replacement": "export default function CredentialManager({ collegeId, type, adminUid }: CredentialManagerProps & { adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "export default function ContactEnquiriesManager() {",
    "replacement": "export default function ContactEnquiriesManager({ adminUid }: { adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "const AdminTrashManager = () => {",
    "replacement": "const AdminTrashManager = ({ adminUid }: { adminUid?: string }) => {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "const CollegeListManager = () => {",
    "replacement": "const CollegeListManager = ({ adminUid }: { adminUid?: string }) => {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "export default function AdmissionInquiryManager({ collegeId, collegeName, mode = 'inquiry' }: { collegeId: string | undefined, collegeName?: string, mode?: 'inquiry' | 'list' | 'cancelled' | 'pending' }) {",
    "replacement": "export default function AdmissionInquiryManager({ collegeId, collegeName, mode = 'inquiry', adminUid }: { collegeId: string | undefined, collegeName?: string, mode?: 'inquiry' | 'list' | 'cancelled' | 'pending', adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "export default function TrashManager({ collegeId }: { collegeId?: string }) {",
    "replacement": "export default function TrashManager({ collegeId, adminUid }: { collegeId?: string; adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "export default function PaymentHistoryManager({ collegeId }: { collegeId?: string }) {",
    "replacement": "export default function PaymentHistoryManager({ collegeId, adminUid }: { collegeId?: string; adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  },
  {
    "target": "export default function PaymentSettingsManager({ collegeId }: { collegeId?: string }) {",
    "replacement": "export default function PaymentSettingsManager({ collegeId, adminUid }: { collegeId?: string; adminUid?: string }) {\n  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || \"\");\n  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);\n  const getDbRef = (path: string) => { const clean = path.startsWith(\"/\") ? path.slice(1) : path; const adminId = resolvedAdminUid || \"default-admin-uid\"; if (clean.startsWith(\"users/\")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };"
  }
]

for filepath in targetFiles:
    if not os.path.exists(filepath):
        print(\"Missing:\", filepath)
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1
    if 'getDefaultAdminUid' not in content:
        content = \"import { getDefaultAdminUid } from '@/lib/adminUtils';\\n\" + content
    
    # 2
    if 'getDbRef' not in content:
        for sig in signatures:
            if sig['target'] in content:
                content = content.replace(sig['target'], sig['replacement'])
                break
    
    # 3
    content = re.sub(r'ref\(realtimeDb,\s*(`[^`]+`|\'[^\']+\'|\"[^\"]+\"|[a-zA-Z0-9_$.{}]+)\)', r'getDbRef(\1)', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(\"Updated:\", filepath)
