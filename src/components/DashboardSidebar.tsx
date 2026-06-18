'use client';

interface SidebarProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  studentName: string;
}

export default function DashboardSidebar({ activeTab, setActiveTab, studentName }: SidebarProps) {
  const menuItems = [
    { id: 1, name: '1. Dashboard', icon: '📊' },
    { id: 2, name: '2. Admission', icon: '📝' },
    { id: 3, name: '3. Profile/Form', icon: '📄' },
    { id: 4, name: '4. Exam Form', icon: '🖋️' },
    { id: 5, name: '5. Fees', icon: '💰' },
    { id: 6, name: '6. Marksheet', icon: '🎓' },
    { id: 7, name: '7. Question Paper', icon: '❓' },
    { id: 8, name: '8. Online Exam', icon: '💻' },
    { id: 9, name: '9. Edit Permission', icon: '🔧' },
    { id: 10, name: '10. Notification', icon: '🔔' },
    { id: 11, name: '11. Documents', icon: '📤' },
  ];

  return (
    <aside className="w-80 bg-[#001529] min-h-screen flex flex-col border-r border-white/5">
      <div className="p-8 border-b border-white/5 bg-black/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-institutional-gold rounded-2xl flex items-center justify-center font-medium text-[#002147] text-xl shadow-lg border border-white/10 shrink-0">
            {studentName?.charAt(0) || 'S'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-white font-medium text-sm tracking-tight truncate capitalize leading-tight italic">{studentName || 'Student'}</h4>
            <span className="text-[9px] font-medium text-institutional-gold tracking-normal capitalize opacity-70">Verified Profile</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar py-6 px-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-[13px] font-medium capitalize tracking-tight transition-all
                  ${activeTab === item.id 
                    ? 'bg-white/10 text-institutional-gold border border-white/10 shadow-lg' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span className="text-lg opacity-70">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-8 bg-black/20 text-center">
        <p className="text-[13px] font-medium text-black capitalize tracking-normal">ERP Portal v4.0</p>
      </div>
    </aside>
  );
}


