
import React, { useMemo, useState } from 'react';
import { CourseClass, Student, Course } from '../types';
import { ChevronLeft, ChevronRight, Clock, User, Calendar as CalendarIcon } from 'lucide-react';

interface AgendaProps {
  classes: CourseClass[];
  students: Student[];
  courses: Course[];
}

const Agenda: React.FC<AgendaProps> = ({ classes, students, courses }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Consistent colors for courses based on their ID
  const getCourseColor = (courseId: string) => {
    const colors = [
      'bg-rose-200 text-rose-900 dark:bg-rose-900/50 dark:text-rose-100 border-rose-300 dark:border-rose-700',
      'bg-blue-200 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100 border-blue-300 dark:border-blue-700',
      'bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100 border-amber-300 dark:border-amber-700',
      'bg-purple-200 text-purple-900 dark:bg-purple-900/50 dark:text-purple-100 border-purple-300 dark:border-purple-700',
      'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700',
    ];
    // Simple hash
    const index = courseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const events = useMemo(() => {
    const items: { date: string, type: 'class' | 'followup', title: string, id: string, details: string, colorClass: string, isStart?: boolean, isEnd?: boolean, dayIndex?: number, duration?: number }[] = [];

    // Helper to parse local YYYY-MM-DD to Date
    const parseDate = (str: string) => {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    // Add Classes
    classes.forEach(c => {
      const course = courses.find(course => course.id === c.courseId);
      const colorClass = getCourseColor(c.courseId);

      if (c.schedule && c.schedule.length > 0) {
          // New Logic: specific dates
          c.schedule.forEach((dateStr, idx) => {
              items.push({
                  date: dateStr,
                  type: 'class',
                  title: course?.name || 'Turma',
                  id: `${c.id}-${dateStr}`,
                  details: `${c.enrolledStudentIds.length}/${c.maxStudents} alunas`,
                  colorClass: colorClass,
                  isStart: idx === 0,
                  isEnd: idx === c.schedule!.length - 1
              });
          });
      } else {
        // Fallback Logic: Range
        const startDate = parseDate(c.startDate);
        const endDate = c.endDate ? parseDate(c.endDate) : startDate;
        
        const loopDate = new Date(startDate);
        let dayCounter = 0;
        
        while (loopDate <= endDate) {
            const dateStr = loopDate.toISOString().split('T')[0];
            items.push({
            date: dateStr,
            type: 'class',
            title: course?.name || 'Turma',
            id: `${c.id}-${dateStr}`, 
            details: `${c.enrolledStudentIds.length}/${c.maxStudents}`,
            colorClass: colorClass,
            isStart: dayCounter === 0,
            isEnd: loopDate.getTime() === endDate.getTime(),
            dayIndex: dayCounter
            });
            loopDate.setDate(loopDate.getDate() + 1);
            dayCounter++;
        }
      }
    });

    // Add Follow-ups
    students.forEach(s => {
      if (s.nextFollowUp) {
        items.push({
          date: s.nextFollowUp,
          type: 'followup',
          title: `${s.name}`,
          id: `follow-${s.id}`,
          details: 'Follow-up',
          colorClass: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
        });
      }
    });

    return items;
  }, [classes, students, courses]);

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  return (
    <div className="pb-20 md:pb-0 animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Agenda & Calendário</h2>
        <div className="flex items-center gap-4 bg-white dark:bg-dark-surface p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-gray-600 dark:text-dark-text">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-gray-800 dark:text-dark-text capitalize min-w-[140px] text-center">{monthName}</span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-gray-600 dark:text-dark-text">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-white/5">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="py-3 text-center text-sm font-bold text-gray-500 dark:text-dark-textMuted">
              {d}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 auto-rows-fr min-h-[600px]">
          {/* Empty cells for previous month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`prev-${i}`} className="border-b border-r border-gray-100 dark:border-dark-border bg-gray-50/30 dark:bg-transparent"></div>
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            // Sort events: Classes first, then followups
            dayEvents.sort((a, b) => (a.type === 'class' ? -1 : 1));

            return (
              <div key={day} className={`border-b border-r border-gray-100 dark:border-dark-border p-1 sm:p-2 min-h-[120px] relative group transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                <span className={`text-sm font-medium block mb-1 text-right ${isToday ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-gray-700 dark:text-dark-text'}`}>
                  {day}
                </span>
                <div className="space-y-1.5">
                  {dayEvents.map((ev, idx) => (
                    <div 
                      key={`${ev.id}-${idx}`} 
                      className={`
                        text-[10px] sm:text-xs px-2 py-1 rounded border shadow-sm cursor-pointer transition-all hover:brightness-95
                        ${ev.colorClass}
                        ${ev.type === 'class' ? 'font-semibold' : 'font-normal'}
                      `}
                      title={`${ev.title} - ${ev.details}`}
                    >
                      <div className="truncate flex justify-between items-center">
                        <span className="truncate">
                            {ev.type === 'followup' && <User size={10} className="inline mr-1"/>}
                            {ev.title}
                        </span>
                        {ev.type === 'class' && (
                            <span className="text-[9px] opacity-80 ml-1">{ev.details}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* List View for Mobile/Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
            <h3 className="font-bold text-gray-800 dark:text-dark-text mb-4 flex items-center gap-2">
               <Clock size={18} className="text-primary-500"/> Próximas Turmas
            </h3>
            <div className="space-y-3">
               {classes
                 .filter(c => new Date(c.startDate) >= new Date())
                 .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                 .slice(0, 5)
                 .map(c => {
                    const course = courses.find(co => co.id === c.courseId);
                    return (
                       <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-dark-border">
                          <div className="bg-white dark:bg-dark-surface p-2 rounded-lg text-center min-w-[50px] shadow-sm">
                             <div className="text-xs text-gray-500 dark:text-dark-textMuted uppercase">{new Date(c.startDate).toLocaleDateString('pt-BR', {month:'short'})}</div>
                             <div className="text-lg font-bold text-gray-800 dark:text-dark-text">{new Date(c.startDate).getDate()}</div>
                          </div>
                          <div>
                             <div className="font-bold text-gray-800 dark:text-dark-text text-sm">{course?.name}</div>
                             <div className="text-xs text-gray-500 dark:text-dark-textMuted">
                               {c.schedule?.length ? `${c.schedule.length} dias de aula` : 'Datas a definir'}
                             </div>
                          </div>
                       </div>
                    )
                 })}
               {classes.filter(c => new Date(c.startDate) >= new Date()).length === 0 && (
                  <p className="text-gray-400 dark:text-dark-textMuted text-sm italic">Nenhuma turma futura agendada.</p>
               )}
            </div>
         </div>

         <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
            <h3 className="font-bold text-gray-800 dark:text-dark-text mb-4 flex items-center gap-2">
               <User size={18} className="text-amber-500"/> Follow-ups Pendentes
            </h3>
            <div className="space-y-3">
               {students
                 .filter(s => s.nextFollowUp && new Date(s.nextFollowUp) <= new Date())
                 .slice(0, 5)
                 .map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                          <div>
                             <div className="font-bold text-gray-800 dark:text-dark-text text-sm">{s.name}</div>
                             <div className="text-xs text-amber-700 dark:text-amber-400">Data: {new Date(s.nextFollowUp).toLocaleDateString('pt-BR')}</div>
                          </div>
                       </div>
                       <a href={`https://wa.me/55${s.phone}`} target="_blank" rel="noreferrer" className="text-xs font-bold bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-100 px-2 py-1 rounded-md">
                          Cobrar
                       </a>
                    </div>
                 ))}
                 {students.filter(s => s.nextFollowUp && new Date(s.nextFollowUp) <= new Date()).length === 0 && (
                  <p className="text-gray-400 dark:text-dark-textMuted text-sm italic">Tudo em dia!</p>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Agenda;
