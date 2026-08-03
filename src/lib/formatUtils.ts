export const formatAutoRegNo = (regNo: string | undefined | null) => {
  if (!regNo) return 'N/A';
  if (regNo.startsWith('MIT-')) return regNo;
  const match = regNo.match(/^(\d{4})(\d{2})R(\d+)$/);
  if (match) {
    const year = match[1];
    const seq = match[3].padStart(5, '0');
    return `MIT-${year}-${seq}`;
  }
  if (/^\d+$/.test(regNo)) {
    return `MIT-2026-${regNo.padStart(5, '0')}`;
  }
  return regNo;
};
