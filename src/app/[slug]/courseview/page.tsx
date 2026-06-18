import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';
import LiveFooter from '@/components/LiveFooter';
import CourseDetailView from '@/components/CourseDetailView';

export default async function CourseViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  return (
    <div className="bg-white min-h-screen font-sans overflow-x-hidden flex flex-col">
      <Header />
      <Navbar />
      <main className="flex-1">
         <CourseDetailView slug={resolvedParams.slug} />
      </main>
      <LiveFooter />
    </div>
  );
}
