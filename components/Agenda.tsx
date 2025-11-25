
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
    const items: { date: string, type: 'class' | 'followup', title: string, id: string, details: string, colorClass: string, time?: string }[] = [];

    // Add Classes
    classes.forEach(c => {
      const course = courses.find(course => course.id === c.courseId);
      const colorClass = getCourseColor(c.courseId);

      if (c.schedule && c.schedule.length > 0) {
          // Specific dates
          c.schedule.forEach((scheduleItem, idx) => {
              items.push({
                  date: scheduleItem.date,
                  type: 'class',
                  title: course?.name || 'Turma',
                  id: `${c.id}-${scheduleItem.date}-${idx}`,
                  details: `${c.enrolledStudentIds.length}/${c.maxStudents} alunas`,
                  colorClass: colorClass,
                  time: `${scheduleItem.startTime}-${scheduleItem.endTime}`
              });
          });
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
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center">
                            <span className="truncate font-bold">
                                {ev.type === 'followup' && <User size={10} className="inline mr-1"/>}
                                {ev.title}
                            </span>
                        </div>
                        {ev.type === 'class' && ev.time && (
                            <span className="text-[9px] opacity-80">{ev.time}</span>
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
    </div>
  );
};

export default Agenda;
