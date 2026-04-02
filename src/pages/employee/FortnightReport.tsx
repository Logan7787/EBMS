import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { DataTable } from '../../components/shared/DataTable'
import { useMyBattaEntries } from '../../hooks/useBatta'
import { useAuthStore } from '../../stores/authStore'
import { getMonthOptions, getYearOptions, formatDate, cn } from '../../lib/utils'
import { getDisplayName } from '../../lib/userUtils'
import { Printer, Calendar, FileText } from 'lucide-react'

export default function FortnightReport() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore(s => s.user)
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString())
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [period, setPeriod] = useState<'1-15' | '16-end'>('1-15')
  
  const { data: allEntries, isLoading } = useMyBattaEntries('approved')

  // Calculate full date range for the period
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const startDay = period === '1-15' ? 1 : 16;
  const endDay = period === '1-15' ? 15 : lastDay;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to midnight for comparison

  const periodDates: string[] = [];
  for (let day = startDay; day <= endDay; day++) {
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    periodDates.push(`${year}-${m}-${d}`);
  }

  // Map each date to an entry or a virtual gap
  const timelineData = periodDates.map(dateStr => {
    const existing = allEntries?.find(e => e.date === dateStr && e.status === 'approved');
    if (existing) return { ...existing, type: 'real' };

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const isSunday = dateObj.getDay() === 0;
    const isFuture = dateObj > today;
    const isToday = dateObj.getTime() === today.getTime();

    let status = 'missing';
    let label = 'MISSING';

    if (isFuture) {
      status = 'upcoming';
      label = 'UPCOMING';
    } else if (isToday) {
      status = 'pending_submission';
      label = 'PENDING';
    } else if (isSunday) {
      status = 'sunday';
      label = 'SUNDAY';
    }

    return {
      date: dateStr,
      type: 'gap',
      status,
      label
    };
  });

  const reportRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const columns = [
    { header: t('batta.date'), accessor: (item: any) => (
      <span className={cn(
        item.status === 'sunday' || new Date(item.date).getDay() === 0 ? "text-red-400 font-bold" : ""
      )}>
        {formatDate(item.date)}
      </span>
    )},
    { header: 'Shift', accessor: (item: any) => {
      if (item.type === 'gap') {
        return (
          <span className={cn(
            "px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-tighter w-fit",
            item.status === 'pending_submission' ? "bg-amber-50 text-amber-600" :
            item.status === 'sunday' ? "bg-slate-100 text-slate-500" : 
            item.status === 'missing' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"
          )}>
            {item.label}
          </span>
        );
      }
      const isWork = item.category === 'Work' || !item.category;
      
      let dutyValue = 1;
      if (isWork) {
        const emp = Array.isArray(item.employee) ? item.employee[0] : item.employee;
        const defaultAmount = Number(emp?.batta_amount || user?.battaAmount || 0);
        const finalAmount = Number((item.approved_amount !== undefined && item.approved_amount !== null) ? item.approved_amount : defaultAmount);
        dutyValue = defaultAmount > 0 ? (finalAmount / defaultAmount) : 1;
      }

      return (
        <div className="flex flex-col">
          <span className={cn(
            "font-medium",
            !isWork && "text-slate-400 italic"
          )}>
            {isWork ? (
              <span className="flex items-center gap-1">
                {item.day_night}
                {dutyValue !== 1 && (
                  <span className="text-[10px] bg-slate-100 px-1 rounded text-indigo-600 font-bold">
                    {dutyValue}
                  </span>
                )}
              </span>
            ) : (item.category === 'Leave' ? 'Leave' : 'No Work')}
          </span>
          {isWork && item.day_night === 'Night' && item.time && (
            <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.time}</span>
          )}
        </div>
      );
    }},
    { header: t('batta.particulars'), accessor: (item: any) => item.type === 'real' ? item.particulars : '-' },
    { header: 'Amount', accessor: (item: any) => {
      if (item.type === 'gap') return item.status === 'sunday' ? '₹0' : '-';
      
      const isWork = item.category === 'Work' || !item.category;
      if (!isWork) return '₹0';
      
      const emp = Array.isArray(item.employee) ? item.employee[0] : item.employee;
      const defaultAmount = emp?.batta_amount || user?.battaAmount || 0;
      const finalAmount = (item.approved_amount !== undefined && item.approved_amount !== null) ? item.approved_amount : defaultAmount;
      return `₹${finalAmount}`;
    }},
    { header: 'Approved By', accessor: (item: any) => {
      if (item.type === 'gap') return '-';
      const approver = Array.isArray(item.approver) ? item.approver[0] : item.approver;
      return getDisplayName(approver, i18n.language) || '-';
    }}
  ]

  const totalAmount = timelineData?.reduce((sum, item: any) => {
    if (item.type === 'gap') return sum;
    const isWork = item.category === 'Work' || !item.category;
    if (!isWork) return sum;

    const emp = Array.isArray(item.employee) ? item.employee[0] : item.employee;
    const defaultAmount = emp?.batta_amount || user?.battaAmount || 0;
    const finalAmount = (item.approved_amount !== undefined && item.approved_amount !== null) ? item.approved_amount : defaultAmount;
    return sum + Number(finalAmount);
  }, 0) || 0;

  const totalDay = timelineData?.reduce((sum, item: any) => {
    if (item.type !== 'real' || (item.category !== 'Work' && item.category) || item.day_night !== 'Day') return sum;
    const emp = Array.isArray(item.employee) ? item.employee[0] : item.employee;
    const defaultAmount = Number(emp?.batta_amount || user?.battaAmount || 0);
    const finalAmount = Number((item.approved_amount !== undefined && item.approved_amount !== null) ? item.approved_amount : defaultAmount);
    return sum + (defaultAmount > 0 ? (finalAmount / defaultAmount) : 1);
  }, 0) || 0;

  const totalNight = timelineData?.reduce((sum, item: any) => {
    if (item.type !== 'real' || (item.category !== 'Work' && item.category) || item.day_night !== 'Night') return sum;
    const emp = Array.isArray(item.employee) ? item.employee[0] : item.employee;
    const defaultAmount = Number(emp?.batta_amount || user?.battaAmount || 0);
    const finalAmount = Number((item.approved_amount !== undefined && item.approved_amount !== null) ? item.approved_amount : defaultAmount);
    return sum + (defaultAmount > 0 ? (finalAmount / defaultAmount) : 1);
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader 
          title={t('nav.report')} 
          subtitle="Generate and print your fortnightly Batta summary."
          action={
            <button 
              onClick={handlePrint}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Printer size={18} />
              {t('actions.print')}
            </button>
          }
        />

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4 mb-8">
          <div className="w-40">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Month</label>
            <select value={month} onChange={e => setMonth(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50">
              {getMonthOptions().map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Year</label>
            <select value={year} onChange={e => setYear(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50">
              {getYearOptions().map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Period</label>
            <select value={period} onChange={e => setPeriod(e.target.value as any)} className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50">
              <option value="1-15">1st - 15th</option>
              <option value="16-end">16th - End</option>
            </select>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 print:shadow-none print:border-0 print:p-0">
        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-indigo-600 uppercase tracking-tight">{t('app.name')}</h2>
            <p className="text-slate-500 font-bold text-sm tracking-widest mt-1 uppercase">Allowance Report</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">{getDisplayName(user, i18n.language)}</p>
            <p className="text-xs text-slate-500">{user?.empCode} • {user?.site}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fortnight Period</p>
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Calendar size={16} className="text-indigo-500" />
              {month}/{year} ({period})
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Total Day</p>
            <div className="text-2xl font-black text-amber-700">
              {totalDay}
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Total Night</p>
            <div className="text-2xl font-black text-indigo-700">
              {totalNight}
            </div>
          </div>

          <div className="bg-indigo-600 p-4 rounded-xl shadow-lg shadow-indigo-100 text-white">
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mb-1">Total Payable</p>
            <div className="text-2xl font-black flex items-center gap-2">
              <FileText size={20} className="text-indigo-300" />
              ₹{totalAmount}
            </div>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={timelineData} 
          loading={isLoading}
        />

        <div className="mt-8 border-t-2 border-slate-100 pt-6">
          <div className="flex justify-between items-center px-6">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Verified By</span>
            <div className="text-right">
              <p className="font-bold text-slate-900">₹{totalAmount}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Total Amount</p>
            </div>
          </div>
          <div className="mt-12 flex justify-between">
            <div className="w-48 border-t border-slate-200 text-center pt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Employee Signature</p>
            </div>
            <div className="w-48 border-t border-slate-200 text-center pt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Manager Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
