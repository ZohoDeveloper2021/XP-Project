/* global ZOHO */
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Calendar, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { confirmAlert } from 'react-confirm-alert';

const Reminder = ({module, RecordId, currentUser, comment}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [formData, setFormData] = useState({
    reminderTime: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [fetchingReminders, setFetchingReminders] = useState(false);

  const showToast = (message, type) => {
    switch(type) {
      case 'success':
        toast.success(message, {
          position: 'top-right',
          duration: 3000,
        });
        break;
      case 'error':
        toast.error(message, {
          position: 'top-right',
          duration: 4000,
        });
        break;
      case 'loading':
        toast.loading(message, {
          position: 'top-right',
          duration: 3000,
        });
        break;
      default:
        toast(message, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#6B7280',
            color: '#FFFFFF',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            fontWeight: '500',
          },
        });
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [module, RecordId]);

  const fetchReminders = async () => {
  try {
    setFetchingReminders(true);
    const config = {
      app_name: "lead-management-system",
      report_name: 'All_Reminders_Dev',
      criteria: `(Record_Id == "${RecordId}" || Accounts == "${RecordId}" || Opportunities == "${RecordId}")`
    };
    
    const response = await ZOHO.CREATOR.DATA.getRecords(config);
    if (response && response.data) {
      setReminders(response.data);
    } else {
      setReminders([]); // Ensure empty state if no data
    }
  } catch (err) {
    console.error('Error fetching reminders:', err);
    setReminders([]); // Fallback to empty array on error
  } finally {
    setFetchingReminders(false);
  }
};

  const convertPKTtoEST = (pktDateTimeStr) => {
    if (!pktDateTimeStr) return '';
    
    const pktDate = new Date(pktDateTimeStr + '+05:00');
    
    try {
      const estFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour12: false,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const parts = estFormatter.formatToParts(pktDate);
      const partMap = {};
      parts.forEach(part => {
        partMap[part.type] = part.value;
      });

      const day = partMap.day.padStart(2, '0');
      const month = partMap.month;
      const year = partMap.year;
      const time = `${partMap.hour}:${partMap.minute}:${partMap.second}`;
      
      return `${day}-${month}-${year} ${time}`;
    } catch (error) {
      console.error('Error converting time:', error);
      showToast('Error processing time conversion', 'error');
      return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reminderTime || !formData.description) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Creating reminder...', { position: 'top-right' });
    
    try {
      const formattedDateTime = convertPKTtoEST(formData.reminderTime);
      if (!formattedDateTime) {
        toast.error('Invalid date/time format', { id: toastId });
        return;
      }

      const newReminder = {
        reminderTime: formattedDateTime,
        description: formData.description,
        Module: module,
        Record_Id: RecordId,
        userEmail: "muhammad.hunbel@xpertprime.com"
      };

      const config = {
        api_name: 'Send_Reminder_to_User',
        http_method: 'POST',
        public_key: 'SxrKF0Qvy3TGZCppP0pY0NHh6',
        payload: newReminder
      };

      const response = await ZOHO.CREATOR.DATA.invokeCustomApi(config);
      
      if (response) {
        console.log("API Response:", response);
        toast.success('Reminder created successfully!', { id: toastId });
        
        await fetchReminders();
        
        setFormData({ reminderTime: '', description: '' });
        setIsFormOpen(false);
      } else {
        toast.error('Failed to create reminder. Please try again.', { id: toastId });
      }
    } catch (err) {
      console.error('Error creating reminder:', err);
      toast.error('Error creating reminder. Please try again.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (reminderId) => {
  confirmAlert({
    title: 'Confirm Deletion',
    message: 'Are you sure you want to delete this reminder?',
    buttons: [
      {
        label: 'Yes',
        onClick: async () => {
          try {
            setDeletingId(reminderId);
            const response = await ZOHO.CREATOR.DATA.deleteRecordById({
              app_name: 'lead-management-system',
              report_name: 'All_Reminders_Dev',
              id: reminderId
            });

            if (response.code === 3000) {
              showToast('Reminder deleted successfully', 'success');
              // Update the state directly instead of refetching
              setReminders(prev => prev.filter(reminder => reminder.ID !== reminderId));
            } else {
              throw new Error(response.message || 'Failed to delete reminder');
            }
          } catch (error) {
            console.error('Error deleting reminder:', error);
            showToast(`Error: ${error.message || 'Failed to delete reminder'}`, 'error');
          } finally {
            setDeletingId(null);
          }
        },
      },
      {
        label: 'No',
        onClick: () => {},
      },
    ],
  });
};
  const handleCancel = () => {
    setFormData({ reminderTime: '', description: '' });
    setIsFormOpen(false);
  };

  const formatDisplayTime = (dateTimeStr) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return dateTimeStr;
    }
  };

  const isUpcoming = (dateTimeStr) => {
    return new Date(dateTimeStr) > new Date();
  };

  const isPastDue = (dateTimeStr) => {
    return new Date(dateTimeStr) < new Date();
  };

  return (
    <div className="">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />
      
      {/* Compact Header */}
      <div className="bg-white rounded-lg">
        <div className="border-b border-gray-200 px-5 py-3 rounded-t-lg flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-700">Reminders</h3>
          {/* Only show the add button if comment is not true */}
          {!comment && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="group p-1 rounded-full bg-[#f29d29] text-white transition-all duration-500 hover:scale-110"
              aria-label="Add reminder"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Loading state for reminders */}
      {fetchingReminders && (
        <div className="flex items-center justify-center mt-5">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Compact Reminders List */}
      {!fetchingReminders && (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div 
              key={reminder.ID} 
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-l-[2px] ${
                isPastDue(reminder.Reminder_Time) 
                  ? 'border-red-400 bg-red-50' 
                  : isUpcoming(reminder.Reminder_Time) 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-blue-400'
              }`}
            >
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-1.5 rounded-md ${
                    isPastDue(reminder.Reminder_Time) 
                      ? 'bg-red-100 text-red-600' 
                      : isUpcoming(reminder.Reminder_Time) 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {isPastDue(reminder.Reminder_Time) ? (
                      <AlertCircle size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                  </div>
                  {/* Only show delete button if comment is not true */}
                  {!comment && (
                    <button
                      onClick={() => handleDelete(reminder.ID)}
                      disabled={deletingId === reminder.ID}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 disabled:opacity-50"
                      aria-label="Delete reminder"
                    >
                      {deletingId === reminder.ID ? (
                        <div className="animate-spin w-3.5 h-3.5 border-2 border-[#f29d29] border-t-transparent rounded-full"></div>
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  )}
                </div>

                {/* Rest of the reminder card content remains the same */}
                <h3 className="font-medium text-gray-800 text-sm mb-2 leading-tight">
                  {reminder.Description}
                </h3>

                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-600">
                    <Calendar size={12} className="mr-1.5 text-gray-400" />
                    <span className="font-medium">PKT:</span>
                    <span className="ml-1">{formatDisplayTime(reminder.Reminder_Time)}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock size={12} className="mr-1.5 text-gray-400" />
                    <span className="font-medium">EST:</span>
                    <span className="ml-1">{convertPKTtoEST(reminder.Reminder_Time)}</span>
                  </div>
                </div>

                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isPastDue(reminder.Reminder_Time) 
                      ? 'bg-red-100 text-red-700' 
                      : isUpcoming(reminder.Reminder_Time) 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isPastDue(reminder.Reminder_Time) ? 'Past Due' : 'Upcoming'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Empty State - Only show the "add" prompt if comment is not true */}
      {!fetchingReminders && reminders.length === 0 && (
        <div className="text-center py-8">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-xs mx-auto">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-[#f29d29] rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">No reminders yet</h3>
            <p className="text-xs text-gray-500">Click + to add your first reminder</p>
          </div>
        </div>
      )}

      {/* Form Modal - This will only show when isFormOpen is true and comment is false */}
      {isFormOpen && !comment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Modal content remains the same */}
        </div>
      )}
    </div>
  );
};

export default Reminder;