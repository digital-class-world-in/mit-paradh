import Link from 'next/link';

export const Header = () => {
  return (
    <div className="w-full">
      {/* Small Top Strip */}
      <div className="bg-[#003366] h-8 flex items-center px-4 md:px-10 justify-between">
        <div className="flex gap-4">
          <span className="text-[13px] text-black font-medium">Government of Maharashtra</span>
          <span className="text-[13px] text-black font-medium border-l border-white/20 pl-4 capitalize tracking-wider">Skill Development Portal</span>
        </div>
        <div className="flex gap-4 text-[13px] text-black font-bold capitalize tracking-tight">
          <button className="hover:text-amber-400">English</button>
          <button className="hover:text-amber-400">मराठी</button>
        </div>
      </div>

      {/* Primary Header */}
      <header className="bg-white px-4 md:px-10 py-6 flex items-center justify-between border-b-4 border-[#003366]">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center shadow-inner border border-slate-200 overflow-hidden p-1">
            <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#003366] tracking-tight leading-tight capitalize">
               MAHALAXMI TECHNICAL INSTITUTE PARADH
            </h1>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6">
           <div className="text-right">
              <p className="text-[13px] font-bold text-black capitalize tracking-tight mb-1">Helpline Number</p>
              <p className="text-lg font-bold text-[#003366]">1800-456-7890</p>
           </div>
           <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center text-3xl border border-slate-200">
             💠
           </div>
        </div>
      </header>
    </div>
  );
};


