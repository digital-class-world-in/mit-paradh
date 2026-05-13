import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';

export default function About() {
  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans">
      <Header />
      <Navbar />
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-4xl font-bold text-[#5D5fb1] mb-6">About Us</h1>
        <p className="text-lg text-slate-700 leading-relaxed">
          Welcome to the Maharashtra State Board of Skill, Vocational Education and Training (MSBSVET). Our mission is to empower learners with industry‑relevant skills and certifications to enhance employability across the state.
        </p>
        {/* Add more descriptive content as needed */}
      </main>
    </div>
  );
}

