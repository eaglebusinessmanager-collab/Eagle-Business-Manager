import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Trash2,
  Edit2,
  Filter,
  Check,
  CalendarDays,
  List,
} from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { CalendarEvent, CalendarEventType, Customer } from '../../types';

export const CalendarPage: React.FC = () => {
  const { business } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('appointment');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(60);

  const loadData = async () => {
    if (!business?.id) return;
    try {
      const [allEvents, allCustomers] = await Promise.all([
        dbService.getCalendarEvents(business.id),
        dbService.getCustomers(business.id),
      ]);
      setEvents(allEvents);
      setCustomers(allCustomers);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const openCreateModal = (dateStr?: string) => {
    const start = dateStr ? new Date(`${dateStr}T09:00:00`) : new Date();
    const end = new Date(start.getTime() + 3600000);

    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setStartDate(start.toISOString().slice(0, 16));
    setEndDate(end.toISOString().slice(0, 16));
    setEventType('appointment');
    setSelectedCustomerId('');
    setReminderMinutes(60);
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setStartDate(event.startDate.slice(0, 16));
    setEndDate(event.endDate.slice(0, 16));
    setEventType(event.type);
    setSelectedCustomerId(event.customerId || '');
    setReminderMinutes(event.reminderMinutes || 60);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !title.trim() || !startDate) return;

    const matchedCustomer = customers.find((c) => c.id === selectedCustomerId);

    const typeColorMap: Record<CalendarEventType, string> = {
      appointment: '#3b82f6',
      task: '#8b5cf6',
      followup: '#06b6d4',
      payment_reminder: '#f59e0b',
      delivery: '#10b981',
      event: '#ec4899',
      other: '#64748b',
    };

    if (editingEvent) {
      await dbService.updateCalendarEvent(editingEvent.id, {
        title,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate || startDate).toISOString(),
        type: eventType,
        customerId: selectedCustomerId || undefined,
        customerName: matchedCustomer?.name,
        reminderMinutes,
        color: typeColorMap[eventType],
      });
    } else {
      const newEvent: CalendarEvent = {
        id: `evt-${Date.now()}`,
        businessId: business.id,
        title,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate || startDate).toISOString(),
        allDay: false,
        type: eventType,
        status: 'pending',
        customerId: selectedCustomerId || undefined,
        customerName: matchedCustomer?.name,
        reminderMinutes,
        color: typeColorMap[eventType],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dbService.createCalendarEvent(newEvent);
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleToggleStatus = async (event: CalendarEvent) => {
    const nextStatus = event.status === 'completed' ? 'pending' : 'completed';
    await dbService.updateCalendarEvent(event.id, { status: nextStatus });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this calendar event?')) {
      await dbService.deleteCalendarEvent(id);
      loadData();
    }
  };

  // Month Navigation
  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Events
  const filteredEvents = events.filter((evt) => {
    if (filterType === 'all') return true;
    return evt.type === filterType;
  });

  // Days in Month grid calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Business Calendar
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Appointments, customer follow-ups, restocking schedules, and payment reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* View Switcher, Filter & Month Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevPeriod}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-black text-slate-900 dark:text-white min-w-[150px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextPeriod}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={jumpToToday}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Today
          </button>
        </div>

        {/* Filters and View Mode */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter events by category"
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="appointment">Appointments</option>
            <option value="task">Tasks</option>
            <option value="followup">Follow-ups</option>
            <option value="payment_reminder">Payment Reminders</option>
            <option value="delivery">Deliveries</option>
            <option value="event">Events</option>
          </select>

          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center text-[11px] font-bold text-slate-400 py-2 bg-slate-50 dark:bg-slate-800/50">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] sm:min-h-[110px] bg-slate-50/50 dark:bg-slate-950/30" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              const daysEvents = filteredEvents.filter((e) => e.startDate.startsWith(dayStr));

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => openCreateModal(dayStr)}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 cursor-pointer transition hover:bg-blue-50/40 dark:hover:bg-blue-950/20 flex flex-col justify-between ${
                    isToday ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-extrabold h-5 w-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {daysEvents.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        {daysEvents.length} event{daysEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Day Events Badges */}
                  <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                    {daysEvents.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(evt);
                        }}
                        style={{ borderLeftColor: evt.color || '#3b82f6' }}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate border-l-2 font-medium cursor-pointer ${
                          evt.status === 'completed'
                            ? 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200'
                        }`}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {daysEvents.length > 3 && (
                      <div className="text-[9px] text-slate-400 pl-1">
                        +{daysEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List / Agenda View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No calendar events found for this filter. Click "New Event" to schedule.
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-start justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/40 transition gap-4"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(evt)}
                    className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center transition ${
                      evt.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                    }`}
                  >
                    {evt.status === 'completed' && <Check className="h-3.5 w-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold ${
                          evt.status === 'completed'
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {evt.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {evt.type.replace('_', ' ')}
                      </span>
                    </div>

                    {evt.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {evt.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(evt.startDate).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {evt.customerName && (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                          <User className="h-3 w-3" />
                          {evt.customerName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(evt)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(evt.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingEvent ? 'Edit Calendar Event' : 'Schedule Business Event'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Site survey, Restock delivery, Customer follow-up"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as CalendarEventType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                  >
                    <option value="appointment">Appointment</option>
                    <option value="task">Task / To-do</option>
                    <option value="followup">Customer Follow-up</option>
                    <option value="payment_reminder">Payment Reminder</option>
                    <option value="delivery">Supplier Delivery</option>
                    <option value="event">Business Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer (Optional)
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">None / Internal Event</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, location, items needed..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  {editingEvent ? 'Update Event' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
