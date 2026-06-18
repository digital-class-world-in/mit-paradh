import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbUrl = 'https://mit-paradh-default-rtdb.firebaseio.com';
    let deletedCount = 0;

    // Blindly delete fileUrl from quickLinks (up to 20 main links, 20 sub links)
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const url = `${dbUrl}/settings/website/home/quickLinks/${i}/subLinks/${j}/fileUrl.json`;
        try {
          await fetch(url, { method: 'DELETE' });
          deletedCount++;
        } catch(e) {}
      }
    }

    // Blindly delete fileUrl from notices
    for (let i = 0; i < 50; i++) {
      const url = `${dbUrl}/settings/website/home/notices/${i}/fileUrl.json`;
      try {
        await fetch(url, { method: 'DELETE' });
        deletedCount++;
      } catch(e) {}
    }

    return NextResponse.json({ message: "Successfully deleted fileUrls using blind delete strategy to avoid massive downloads." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
