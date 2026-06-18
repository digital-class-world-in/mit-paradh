'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';
import { Quote, BookOpen, GraduationCap, Compass, Target, Info, Sparkles, User, School, MapPin } from 'lucide-react';
import LiveFooter from '@/components/LiveFooter';

const DEFAULT_ABOUT_DATA = {
  heroTitle: 'About Our Institution',
  heroSubtitle: 'Deriving inspiration from Swami Vivekananda to build a wholesome system of skill development and vocational training.',
  heading: 'Mhavishnu Gramin Vikas V shaikshanik Bahu Uddeshiyan sanstha Operated By',
  description: 'Mahalaxmi Institute Of Technology Paradha Bk And Goregaon is inspired by the lives and ideologies of one of the towering figures in the long and illustrious spiritual history of India and regarded as one of the main moulders of the modern world. Our Inspiration.',
  inspirationHeading: 'Our Inspiration',
  inspirationText: `Mhavishnu Gramin Vikas V shaikshanik Bahu Uddeshiyan sanstha Operated By Mahalaxmi Institute Of Technology Paradha Bk And Goregaon is inspired by the lives and ideologies of one of the towering figures in the long and illustrious spiritual history of India and regarded as one of the main moulders of the modern world.

While undertaking the tremendous task of freeing humanity from the shackles they built for themselves through ignorance manifesting in various forms, Swami ji insightfully pointed out the ultimate and broad goal of education as the manifestation of perfection inherent in Man.

Further, he outlined the ways in which the system of education had to be revamped and revivified in order to better suit this purpose and personally set in motion the task of translating these ideas into the field of action.

As an institution deriving inspiration from Swami Vivekananda, MIT Paradh strives to bring into fruition the wholesome system of education as envisioned by Swami ji and thereby enrich the educational landscape of India and the world at large.`,
  quotes: [] as any[],
  chairmanName: 'Shree Avinash Nandkishor Kulkarni',
  chairmanDesignation: 'Chairman Mahavishnu G.V.V.S.B.S Dhamangaon (Dhad)',
  chairmanMessage: `Dear Students,
Welcome to Mhavishnu Gramin Vikas V shaikshanik Bahu Uddeshiyan sanstha Operated By Mahalaxmi Institute Of Technology Paradha Bk And Goregaon
At MIT, we are committed to nurturing minds, fostering innovation, and empowering our students to become leaders in their respective fields. Our vision is to create a dynamic learning environment that not only equips students with academic knowledge but also instills in them the values of integrity, compassion, and resilience.

As you embark on your educational journey with us, you will have access to a diverse range of undergraduate, postgraduate, and doctoral programs across various disciplines including Business, Design, Communication, Skill Development, Pharmacy, Paramedical, Nursing, Art & Culture development, Engineering, and more. Our faculty members, who are experts in their fields, are dedicated to providing you with the guidance and support needed to excel academically and professionally.

Moreover, we are committed to promoting research and innovation, contributing to the intellectual and socio-economic development of Pardha Bk. Goregaon and beyond. Through our collaborative efforts with industry partners and research institutions, we strive to create opportunities for hands-on learning and real-world impact.

As members of the MIT Paradh Bk family, you are not just students; you are integral contributors to our vibrant community. We encourage you to seize every opportunity for personal and intellectual growth, to embrace diversity, and to make a positive difference in the world.

Should you have any questions or need assistance during your time at MIT Paradh Bk, please do not hesitate to reach out to us. Our dedicated faculty and staff are here to support you every step of the way.

Wishing you a rewarding and fulfilling academic journey at Mhavishnu Gramin Vikas V shaikshanik Bahu Uddeshiyan sanstha Operated By Mahalaxmi Institute Of Technology Paradha Bk And Goregaon`,
  secretaryName: 'Prof.Aniket N. Kulkarni',
  secretaryDesignation: 'Secretary Mahavishnu G.V.V.S.B.S Dhamangaon (Dhad)',
  secretaryMessage: `Dear Students,
It is with great pleasure and enthusiasm that I welcome you to Mhavishnu Gramin Vikas V shaikshanik Bahu Uddeshiyan sanstha Operated By Mahalaxmi Institute Of Technology Paradha Bk And Goregaon
As the Secretary of MIT ParadhBk Goregaon , I am honored to lead this esteemed institution on a journey of academic excellence, innovation, and societal impact. Our university stands as a beacon of knowledge and opportunity, committed to shaping the future leaders of tomorrow.

At MIT ParadhBk, we believe in the transformative power of education. Our mission is to provide a conducive environment where student scan explore their passions, expand their horizons, and realize their full potential. Through our comprehensive range of academic programs and research initiatives, we strive to equip our student swith the skills, knowledge, and values needed to thrive in a rapidly changing world.

We take pride in our dedicated faculty members who are not only experts in their respective fields but also mentors and guides, inspiring students to think critically , question assumptions, and innovate solutions to real-world challenges. Together, we foster a culture of academic excellence, intellectual curiosity, and ethical responsibility.

As we embark on this journey together, I encourage each and every one of you to embrace the opportunities and challenges that lie ahead. Let us work collaboratively to create a vibrant and inclusive learning community where diversity is celebrated, creativity is encouraged, and excellence is pursued relentlessly.

To our students, I extend my warmest congratulations on choosing MIT Paradh Bk. as your academic home. Your journey here will be one of growth, discovery, and transformation. To our faculty and staff, I express my deepest gratitude for your unwavering dedication and commitment to our shared vision.

Together, let us write the next chapter in the storied history of Mahalaxmi Institute Of Technology Paradha Bk And Goregaon, leaving a lasting legacy of excellent and impact for generations to come.`,
  ceoName: 'Mr. Pravin T. Deshmukh',
  ceoDesignation: 'Vice Chairman Mahavishnu G.V.V.S.B.S Dhamangaon (Dhad)',
  ceoMessage: `Dear Students,
Welcome to Mhavishnu Gramin Vikas V shaikshanik Bahu Uddeshiyan sanstha Operated By Mahalaxmi Institute Of Technology Paradha Bk And Goregaon
Where academic excellence and integrity are central to our mission. As the Controller of Examination , I am honored to oversee the evaluation processes that ensure your academic achievements are recognized with the highest standards of fairness and transparency.

Our examination system is meticulously designed to assess not only your knowledge but also your ability to apply it in practical and innovative ways. We are committed to conducting all evaluations-whethere written exams, practicals, or viva -voce with the utmost rigor and impartiality.

Wishing you a rewarding and fulfilling academic journey at Mahalaxmi Institute Of Technology Paradha Bk And Goregaon`,
  chairmanImage: '',
  secretaryImage: '',
  ceoImage: '',
  inspirationImage: '',
  institutes: [] as any[],
  recognitions: [] as any[]
};

export default function About() {
  const [data, setData] = useState<any>(DEFAULT_ABOUT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cache_about');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Object.keys(parsed).length > 0) {
            setData(parsed);
          }
        }
      } catch (e) {}
      setLoading(false);
    }

    const dataRef = ref(realtimeDb, 'settings/website/about');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setData(val);
        try { localStorage.setItem('cache_about', JSON.stringify(val)); } catch (e) {}
      } else {
        setData(DEFAULT_ABOUT_DATA);
        try { localStorage.removeItem('cache_about'); } catch (e) {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const staticQuotes = [
    {
      text: "Education is not the amount of information that is put into your brain and runs riot there, undigested, all your life. We must have life-building, manmaking, character-making assimilation of ideas. If you have accumulated five ideas and made them your life and character, you have more education than any man who has got by heart a whole library. If education is identical with information, the libraries are the greatest sages in the world and encyclopedias are the Rishis.",
      theme: "True Education vs Information"
    },
    {
      text: "We want that education by which character is formed, strength of mind is increased, the intellect is expanded, and by which one can stand on one's own feet.",
      theme: "Self-Reliance & Character"
    },
    {
      text: "What is education? Is it book-learning? No. Is it diverse knowledge? Not even that. The training by which the current and expression of will are brought under control and become fruitful is called education.",
      theme: "Control of Will"
    },
    {
      text: "To me the very essence of education is concentration of mind, not the collecting of facts.",
      theme: "Concentration of Mind"
    },
    {
      text: "My idea of education is personal contact with the teacher — guru-griha-vasa. Without the personal life of a teacher there would be no education. One should live from his very boyhood with one whose character is like a blazing fire and should have before him a living example of the highest teaching. In our country, the imparting of education has always been through men of renunciation. India had all good prospects so long as tyagis (men of renunciation) used to impart knowledge.",
      theme: "Role of the Teacher"
    },
    {
      text: "The old institution of 'living with the guru' and similar systems of imparting education are needed. What we want is Western science coupled with Vedanta, Brahmacharya as the guidance motto, and also Shraddha and faith in one's own self.",
      theme: "Synthesis of Science & Vedanta"
    }
  ];

  if (!data) {
    return (
      <div className="bg-[#f8fafc] min-h-screen font-sans">
        <Header />
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading about information...</p>
        </div>
        <LiveFooter />
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans">
      <Header />
      <Navbar />

      {/* Hero Banner Section */}
      <div className="relative bg-[#002147] text-white py-20 overflow-hidden">
        {/* Decorative Grid Patterns */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute -left-1/4 -top-1/2 w-96 h-96 bg-amber-500 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute -right-1/4 -bottom-1/2 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-20"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
            <Sparkles size={12} /> Established With Vision
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight italic">
            {data.heroTitle}
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm md:text-base font-semibold leading-relaxed">
            {data.heroSubtitle}
          </p>
        </div>
      </div>



      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-6 py-16 space-y-20">

        {/* Dynamic Header Block from DB */}
        <div className="bg-white border-2 border-black rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-[#002147]">
            <Info size={24} />
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">President / Society Address</h2>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg md:text-xl font-black text-slate-800 leading-snug">
              {data.heading}
            </h3>
            <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-sm md:text-base">
              {data.description}
            </p>
          </div>
        </div>

        {/* Our Inspiration Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Content Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">Inspirational Lineage</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight italic">
                {data.inspirationHeading}
              </h2>
            </div>

            <div className="space-y-4 text-slate-600 font-medium leading-relaxed text-sm md:text-base whitespace-pre-wrap">
              {data.inspirationText.split('\n').filter((p: string) => p.trim() !== '').map((para: string, pIdx: number) => {
                const isQuotePara = para.includes("While undertaking the tremendous task");
                if (isQuotePara || pIdx === 1) {
                  return (
                    <p key={pIdx} className="border-l-4 border-amber-500 pl-4 py-1 italic bg-amber-500/5 rounded-r-xl">
                      {para}
                    </p>
                  );
                }
                return (
                  <p key={pIdx}>
                    {para}
                  </p>
                );
              })}
            </div>

            {/* Vision / Mission Badges */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                  <Target size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase">Vision</h4>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">To manifest perfection inherent in every learner.</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                  <Compass size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase">Mission</h4>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">To enrich India's educational and vocational landscape.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vivekananda Portrait Card Column */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group max-w-sm w-full">
              {/* Decorative backgrounds */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-orange-400 rounded-[2.5rem] transform rotate-3 scale-95 opacity-50 group-hover:rotate-6 transition-transform duration-300"></div>
              <div className="absolute inset-0 bg-[#002147] rounded-[2.5rem] transform -rotate-3 scale-95 opacity-10 group-hover:-rotate-6 transition-transform duration-300"></div>

              <div className="relative bg-white border-2 border-black rounded-[2.5rem] overflow-hidden shadow-lg p-3">
                <div className="relative h-[400px] w-full rounded-[2rem] overflow-hidden bg-slate-50">
                  <img
                    src={data.inspirationImage || "/swami-vivekananda.png"}
                    alt="Our Inspiration"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white text-center">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Inspirational Guide</p>
                    <h3 className="text-lg font-black tracking-wide mt-1">Swami Vivekananda</h3>
                    <p className="text-[10px] text-slate-300 italic">(1863 - 1902)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission, Vision & Core Values Section */}
        <section className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="inline-flex p-3 rounded-full bg-[#00a5a5]/10 border border-[#00a5a5]/20 text-[#00a5a5]">
              <Target size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">
              Our Vision, Mission & Core Values
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              The foundational pillars that guide our educational commitment
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Vision & Core Values Column */}
            <div className="lg:col-span-5 space-y-8">
              {/* Vision Card */}
              <div className="bg-[#002147] text-white rounded-[2.5rem] p-8 md:p-10 border-2 border-black shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 opacity-5 pointer-events-none">
                  <Compass size={200} />
                </div>
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-inner">
                    <Compass size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Mit Vision</span>
                    <h3 className="text-xl font-black uppercase tracking-tight">Our Vision</h3>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-200 leading-relaxed italic">
                  "Our vision is to be a leading global institution of higher learning, renowned for our commitment to excellence, innovation, and cultural enrichment. We envision a future where MIT stands."
                </p>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 text-xs font-medium text-slate-300 leading-relaxed">
                  To contribute to the universalisation of school education, by providing inclusive flexible, quality school education for life and livelihood, imparting vocational skills along with academic education for sustainable development of nation and society.
                </div>
              </div>

              {/* Core Values Card */}
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border-2 border-black shadow-sm space-y-6 relative overflow-hidden">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="p-3 rounded-2xl bg-emerald-500 text-white">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Foundational Values</span>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Core Values</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: "Academic Quality & Excellence",
                      desc: "Commitment to achieving the highest standards of academic quality, teaching, and research."
                    },
                    {
                      title: "Diversity & Inclusion",
                      desc: "Embracing and celebrating the diversity of cultures, backgrounds, and perspectives within the university community."
                    },
                    {
                      title: "Curiosity & Social Responsibility",
                      desc: "Recognition and encouragement of intellectual curiosity, academic integrity, and societal responsibility."
                    }
                  ].map((val, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 items-start animate-fade-in">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase">{val.title}</h4>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed">{val.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mission Column */}
            <div className="lg:col-span-7 bg-[#00a5a5] text-white rounded-[2.5rem] p-8 md:p-10 border-2 border-black shadow-sm space-y-6 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 opacity-5 pointer-events-none">
                <Target size={250} />
              </div>

              <div className="space-y-6 w-full">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="p-3 rounded-2xl bg-white text-[#00a5a5] shadow-md">
                    <Target size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-teal-100 uppercase tracking-widest block">Mit Mission</span>
                    <h3 className="text-xl font-black uppercase tracking-tight">Our Mission</h3>
                  </div>
                </div>

                <p className="text-sm font-semibold text-teal-50 leading-relaxed italic bg-black/10 p-5 rounded-2xl border border-white/5">
                  "This mission statement reflects a commitment to academic excellence, cultural diversity, global citizenship, and societal impact, which are often central themes for international universities aiming to make a difference in the world."
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    "To promote open schooling system at the national and international levels and achieve excellence therein, by providing inclusive, flexible, quality education for all.",
                    "To empower the underprivileged sections of society, particularly school drop outs by providing them with a second chance to complete their education.",
                    "Reaching the Unreached and bringing good education to their doorsteps.",
                    "To provide Industry based learning through a wide variety of skill development programmes.",
                    "Providing quality education to society and economically backward class.",
                    "Bringing about educational and cultural development of rural people.",
                    "Providing excellent facilities for hostel accommodation, physical education and value education.",
                    "Bringing about social transformation through education.",
                    "Creating resources and utilizing them for educational upliftment of common people.",
                    "Promoting intellectual, ethical and cultural development of society.",
                    "Introduction of technical and professional education for increasing employability and economic development.",
                    "Creating widespread educational network seeking mass participation in education."
                  ].map((mission, idx) => (
                    <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-3 items-start hover:bg-white/10 transition-colors">
                      <div className="w-5 h-5 rounded-full bg-white/10 text-white font-bold text-[10px] flex items-center justify-center shrink-0 border border-white/20">
                        {idx + 1}
                      </div>
                      <p className="text-[11px] font-medium text-teal-50 leading-relaxed">{mission}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Leadership Messages Section */}
        <section className="space-y-12" id="leadership">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="inline-flex p-3 rounded-full bg-blue-50 border border-blue-100 text-[#002147]">
              <GraduationCap size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">
              Messages from our Leadership
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Words of guidance and inspiration from our directors
            </p>
          </div>

          <div className="space-y-12">
            {/* Chairman Message Block */}
            <div className="bg-white border-2 border-black rounded-[2.5rem] overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
              {/* Left: Profile Card (Blue) */}
              <div className="lg:col-span-4 bg-[#002147] text-white p-8 md:p-10 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-black">
                <div className="space-y-6">
                  {data.chairmanImage ? (
                    <div className="w-[120px] h-[150px] bg-white p-2 shadow-xl border border-slate-200 shrink-0">
                      <img src={data.chairmanImage} alt="Chairman" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-[120px] h-[150px] bg-white p-2 shadow-xl border border-slate-200 shrink-0">
                      <div className="w-full h-full bg-amber-500 flex items-center justify-center font-black text-4xl text-white shadow-inner">
                        C
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Leadership</span>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-tight">
                      {data.chairmanName || 'Shree Avinash Nandkishor Kulkarni'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider leading-relaxed">
                      {data.chairmanDesignation || 'Chairman Mahavishnu G.V.V.S.B.S Dhamangaon (Dhad)'}
                    </p>
                  </div>
                </div>
              </div>
              {/* Right: Message Content */}
              <div className="lg:col-span-8 p-8 md:p-10 flex flex-col justify-between bg-white relative">
                <div className="absolute top-8 right-8 text-slate-100 pointer-events-none select-none">
                  <Quote size={100} className="opacity-45" />
                </div>
                <div className="space-y-6 relative z-10">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Chairman's Address</span>
                  <div className="space-y-4 text-slate-600 font-medium leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                    {(data.chairmanMessage || '').split('\n').filter((p: string) => p.trim() !== '').map((para: string, pIdx: number) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Secretary Message Block */}
            <div className="bg-white border-2 border-black rounded-[2.5rem] overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
              {/* Left: Message Content */}
              <div className="lg:col-span-8 p-8 md:p-10 flex flex-col justify-between bg-white relative order-2 lg:order-1">
                <div className="absolute top-8 left-8 text-slate-100 pointer-events-none select-none">
                  <Quote size={100} className="opacity-45 -scale-x-100" />
                </div>
                <div className="space-y-6 relative z-10">
                  <span className="text-xs font-bold text-[#00a5a5] uppercase tracking-widest">Secretary's Address</span>
                  <div className="space-y-4 text-slate-600 font-medium leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                    {(data.secretaryMessage || '').split('\n').filter((p: string) => p.trim() !== '').map((para: string, pIdx: number) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>
              {/* Right: Profile Card (Teal) */}
              <div className="lg:col-span-4 bg-[#00a5a5] text-white p-8 md:p-10 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-l-2 border-black order-1 lg:order-2">
                <div className="space-y-6">
                  {data.secretaryImage ? (
                    <div className="w-[120px] h-[150px] bg-white p-2 shadow-xl border border-slate-200 shrink-0">
                      <img src={data.secretaryImage} alt="Secretary" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-[120px] h-[150px] bg-white p-2 shadow-xl border border-slate-200 shrink-0">
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center font-black text-4xl text-[#00a5a5] shadow-inner">
                        S
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-100 uppercase tracking-widest block">Administration</span>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-tight">
                      {data.secretaryName || 'Prof.Aniket N. Kulkarni'}
                    </h3>
                    <p className="text-[10px] font-bold text-teal-100 uppercase tracking-wider leading-relaxed">
                      {data.secretaryDesignation || 'Secretary Mahavishnu G.V.V.S.B.S Dhamangaon (Dhad)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vice Chairman Message Block */}
            <div className="bg-white border-2 border-black rounded-[2.5rem] overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
              {/* Left: Profile Card (Slate Gray) */}
              <div className="lg:col-span-4 bg-slate-800 text-white p-8 md:p-10 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-black">
                <div className="space-y-6">
                  {data.ceoImage ? (
                    <div className="w-[120px] h-[150px] bg-white p-2 shadow-xl border border-slate-200 shrink-0">
                      <img src={data.ceoImage} alt="Vice Chairman" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-[120px] h-[150px] bg-white p-2 shadow-xl border border-slate-200 shrink-0">
                      <div className="w-full h-full bg-[#002147] flex items-center justify-center font-black text-4xl text-white shadow-inner">
                        C
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Evaluation & Auditing</span>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-tight">
                      {data.ceoName || 'Mr. Pravin T. Deshmukh'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider leading-relaxed">
                      {data.ceoDesignation || 'Vice Chairman Mahavishnu G.V.V.S.B.S Dhamangaon (Dhad)'}
                    </p>
                  </div>
                </div>
              </div>
              {/* Right: Message Content */}
              <div className="lg:col-span-8 p-8 md:p-10 flex flex-col justify-between bg-white relative">
                <div className="absolute top-8 right-8 text-slate-100 pointer-events-none select-none">
                  <Quote size={100} className="opacity-45" />
                </div>
                <div className="space-y-6 relative z-10">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Vice Chairman's Address</span>
                  <div className="space-y-4 text-slate-600 font-medium leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                    {(data.ceoMessage || '').split('\n').filter((p: string) => p.trim() !== '').map((para: string, pIdx: number) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Affiliated Institutes Section */}
        <section className="space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="inline-flex p-3 rounded-full bg-blue-50 border border-blue-100 text-[#002147]">
              <School size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">
              Our Institutes
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Mhavishnu Gramin Vikas V Shaikshanik Bahu Uddeshiyan Sanstha Operated By
            </p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto px-4">
            {(data.institutes && data.institutes.length > 0 ? data.institutes : [
              {
                name: "MAHALAXMI VOCATIONAL EDUCATION AND TRAINING INSTITUTE PARADH BK",
                location: "TQ Bhokardan, Dist Jalna"
              },
              {
                name: "MAHAVISHNU GRAMEEN VIKAS AND SHAISHANIK BAHUUDESHIY SANTHA'S OM SAI SKILL DEVELOPMENT INSTITUTE",
                location: "Paradh Budruk, Taluka Bhokardan, District Jalna"
              },
              {
                name: "MAHAVISHNU GRAMEEN VIKAS AND SHAISHANIK BAHUUDESHIY SANTHA'S MAHALAKSHMI SKILL DEVELOPMENT INSTITUTE",
                location: "Goregaon, Taluka Sengaon, District Hingoli"
              },
              {
                name: "MAHALAXMI TECHNICAL INSTITUTE PARADH BK",
                location: "Jalna"
              },
              {
                name: "MAHALAXMI NURSING & TECHNICAL INSTITUTE PARADH BK",
                location: "Jalna"
              },
              {
                name: "MAHALAXMI ANIMAL FISHERY SCIENCES TECHNICAL COLLEGE",
                location: "Paradh"
              },
              {
                name: "MAHALAXMI MADHYMIK V UCCH MADHYMIK VIDYALAY PARADH BK",
                location: "Maharashtra"
              }
            ]).map((inst: any, idx: number) => {
              const srNo = String(idx + 1).padStart(2, '0');
              return (
                <div key={idx} className="bg-[#1c1c1e] border-2 border-black rounded-3xl overflow-hidden flex items-stretch shadow-sm hover:scale-[1.01] transition-transform duration-300">
                  <div className="w-20 bg-[#2c2c2e] border-r-2 border-black/50 flex items-center justify-center text-[#ff9f1c] font-black text-lg select-none">
                    {srNo}
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide leading-relaxed m-0">
                      {inst.name}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300 w-fit">
                      <MapPin size={10} className="text-[#ff9f1c] shrink-0" />
                      <span>{inst.location}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Infinite Logo Marquee Section */}
      <div className="bg-white border-y-2 border-black overflow-hidden flex flex-col relative select-none">
        {/* Centered Title Banner at Top */}
        <div className="bg-[#002147] text-white py-3 border-b-2 border-black z-20 flex items-center justify-center">
          <span className="text-sm font-black uppercase tracking-widest text-amber-400">
            Recognition / Approvals
          </span>
        </div>

        {/* Scrolling Logotypes below the banner */}
        <div className="flex overflow-hidden relative items-center py-10">
          <div className="flex shrink-0 gap-28 items-center animate-marquee whitespace-nowrap min-w-full justify-around pr-10">
            {(data.recognitions && data.recognitions.length > 0 ? data.recognitions : [
              { imageUrl: "https://ik.imagekit.io/gnzjd77mb/download%20(2).jfif?updatedAt=1779189524664", name: "" },
              { imageUrl: "https://ik.imagekit.io/gnzjd77mb/Board%20Logo%20-%20small%20size.jpg", name: "" },
              { imageUrl: "https://ik.imagekit.io/gnzjd77mb/Seal_of_Maharashtra.png", name: "" },
              { imageUrl: "https://ik.imagekit.io/gnzjd77mb/download%20(3).jfif", name: "" },
              { imageUrl: "https://ik.imagekit.io/gnzjd77mb/images.png?updatedAt=1779189743980", name: "" }
            ]).map((rec: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                <img src={rec.imageUrl} className="h-20 w-auto object-contain max-w-[240px] hover:scale-110 transition-transform duration-300 pointer-events-none" alt={rec.name || "Affiliated Board Logo"} />
                {rec.name && <span className="text-[10px] font-black text-[#002147] uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">{rec.name}</span>}
              </div>
            ))}
          </div>
          <div className="flex shrink-0 gap-28 items-center animate-marquee whitespace-nowrap min-w-full justify-around pr-10" aria-hidden="true">
            {(data.recognitions && data.recognitions.length > 0 ? data.recognitions : [
              { imageUrl: "https://ik.imagekit.io/gnzjd77mb/download%20(2).jfif?updatedAt=1779189524664", name: "" },
              { imageUrl: "https://ik.imagekit.io/gnzjd77mb/Board%20Logo%20-%20small%20size.jpg", name: "" },
              { imageUrl: "https://ik.imagekit.io/gnzjd77mb/Seal_of_Maharashtra.png", name: "" },
              { imageUrl: "https://ik.imagekit.io/gnzjd77mb/download%20(3).jfif", name: "" },
              { imageUrl: "https://ik.imagekit.io/gnzjd77mb/images.png?updatedAt=1779189743980", name: "" }
            ]).map((rec: any, idx: number) => (
              <div key={`dup-${idx}`} className="flex flex-col items-center gap-3">
                <img src={rec.imageUrl} className="h-20 w-auto object-contain max-w-[240px] hover:scale-110 transition-transform duration-300 pointer-events-none" alt={rec.name || "Affiliated Board Logo"} />
                {rec.name && <span className="text-[10px] font-black text-[#002147] uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">{rec.name}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <LiveFooter />
    </div>
  );
}
