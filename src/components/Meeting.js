/* global ZOHO */
import React, { useState, useEffect } from "react";
import AllMeeting from "./AllMeeting";
import DTPicker from "./DateTimePicker";
import { format, addMinutes } from "date-fns";

const Meeting = ({
  module,
  RecordId,
  currentUser,
  lead,
  userId,
  onMeetingCreated,
}) => {
  const [dateTime, setDateTime] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [sources, setSources] = useState([]);
  const [user, setUser] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [formData, setFormData] = useState(() => {
    const now = new Date();
    const endTime = addMinutes(now, 30);
    return {
      startDate: now,
      startTime: format(now, "HH:mm"),
      endDate: endTime,
      endTime: format(endTime, "HH:mm"),
      clientName: lead?.Name || lead?.Opportunity_Name || "",
      source:
        lead?.Lead_Source?.ID ||
        lead?.Sources?.ID ||
        lead?.Contact_Source?.ID ||
        "",
      hostName: [],
      recordingLink: "",
      jobDescription: lead?.Job_Description || "",
      meetingName: "",
    };
  });
  console.log("lead >", lead);

  useEffect(() => {
    let meetingName = "";

    if (lead?.Name) {
      meetingName = `Meeting: ${lead.Name} (${lead["Profile.Pseudo_Name"]})`;
    } else {
      meetingName = `Meeting: ${lead?.Opportunity_Name} (${lead["Select_Profile.Pseudo_Name"]})`;
    }

    setFormData((prev) => ({
      ...prev,
      meetingName,
    }));
  }, [formData.clientName, lead?.Sudo_Name]);
  let config = {
    app_name: "lead-management-system",
    report_name: "All_Sources_Dev",
    max_records: 1000,
  };

  console.log(RecordId);

  const updateEndTime = (startDate, startTime) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(hours, minutes);

    const endDateTime = addMinutes(startDateTime, 30);

    return {
      endDate: endDateTime,
      endTime: format(endDateTime, "HH:mm"),
    };
  };
  const handleStartDateTimeChange = (newDate, newTime) => {
    const newEndValues = updateEndTime(newDate, newTime);
    setFormData((prev) => ({
      ...prev,
      startDate: newDate,
      startTime: newTime,
      ...newEndValues,
    }));
  };

  // Toast component
  const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div className="fixed top-4 right-4 z-50 animate-slide-in">
        <div
          className={`px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${
            type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {type === "success" ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
          <span className="font-medium">{message}</span>
          <button onClick={onClose} className="ml-4 hover:opacity-75">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Helper function to show toast
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  // Helper function to format date and time to dd-MMM-yyyy HH:mm:ss
  const formatDateTime = (date, time) => {
    if (!date || !time) return null;

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const day = String(date.getDate()).padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const timeWithSeconds =
      time.includes(":") && time.split(":").length === 2 ? `${time}:00` : time;

    return `${day}-${month}-${year} ${timeWithSeconds}`;
  };

  async function fetchSource() {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords(config);
      const records = response.data || [];
      setSources(records);
    } catch (error) {
      console.error("Error fetching data from Zoho:", error);
      throw error;
    }
  }

  useEffect(() => {
    fetchSource();
  }, []);

  // Auto-set end time when start time changes
  useEffect(() => {
    if (formData.startTime && formData.startDate) {
      const [hours, minutes] = formData.startTime.split(":").map(Number);
      let newHours = hours;
      let newMinutes = minutes + 30;

      if (newMinutes >= 60) {
        newHours += 1;
        newMinutes -= 60;
      }

      const formattedHours = String(newHours).padStart(2, "0");
      const formattedMinutes = String(newMinutes).padStart(2, "0");
      const newEndTime = `${formattedHours}:${formattedMinutes}`;

      setFormData((prev) => ({
        ...prev,
        endTime: newEndTime,
        endDate: prev.endDate || prev.startDate,
      }));
    }
  }, [formData.startTime, formData.startDate]);

  useEffect(() => {
    if (lead && lead.ID) {
      setFormData((prev) => ({
        ...prev,
        clientName: lead?.Name || lead?.Opportunity_Name || "",
        source:
          lead?.Lead_Source?.ID ||
          lead?.Sources?.ID ||
          lead?.Contact_Source?.ID ||
          "",
        jobDescription: lead?.Job_Description || "",
      }));
    }
  }, [lead]);

  // Multi-select dropdown component
  const MultiSelectDropdown = ({
    options,
    selectedValues,
    onChange,
    placeholder,
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (optionEmail) => {
      const updatedValues = selectedValues.includes(optionEmail)
        ? selectedValues.filter((val) => val !== optionEmail)
        : [...selectedValues, optionEmail];

      onChange(updatedValues);
    };

    const removeOption = (optionEmail) => {
      const updatedValues = selectedValues.filter((val) => val !== optionEmail);
      onChange(updatedValues);
    };

    const getSelectedNames = () => {
      return selectedValues
        .map((email) => {
          const option = options.find((opt) => opt.Email === email);
          return option ? option.Name : "";
        })
        .filter(Boolean);
    };

    return (
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full min-h-[32px] p-1 border border-gray-300 rounded bg-white cursor-pointer focus:ring-[#f29d29] focus:border-[#f29d29] flex flex-wrap gap-1 items-center"
        >
          {selectedValues.length === 0 ? (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          ) : (
            <>
              {getSelectedNames().map((name, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-[#f29d29] text-white text-xs rounded-full"
                >
                  {name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const emailToRemove = selectedValues[index];
                      removeOption(emailToRemove);
                    }}
                    className="ml-1 text-white hover:text-gray-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </>
          )}
          <svg
            className={`w-4 h-4 ml-auto transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
            {options.map((option, index) => (
              <div
                key={index}
                onClick={() => toggleOption(option.Email)}
                className={`p-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between text-sm ${
                  selectedValues.includes(option.Email)
                    ? "bg-orange-50 text-[#f29d29]"
                    : ""
                }`}
              >
                <div>
                  <div>{option.Name}</div>
                  <div className="text-xs text-gray-500">{option.Email}</div>
                </div>
                {selectedValues.includes(option.Email) && (
                  <svg
                    className="w-4 h-4 text-[#f29d29]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Enhanced Date Picker Component
  const DateTimePicker = ({
    label,
    date,
    time,
    onDateChange,
    onTimeChange,
    isStartDateTime = false,
  }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(date);
    const [tempTime, setTempTime] = useState(time);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [month, setMonth] = useState(
      date ? date.getMonth() : today.getMonth()
    );
    const [year, setYear] = useState(
      date ? date.getFullYear() : today.getFullYear()
    );

    // Calculate calendar variables
    const currentMonthFirstDay = new Date(year, month, 1);
    const firstDayOfMonth = currentMonthFirstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysFromNextMonth = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7;

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const isDateDisabled = (dayDate) => {
      return dayDate < today;
    };

    // Sync temp values when props change
    useEffect(() => {
      setTempDate(date);
      setTempTime(time);
    }, [date, time]);

    // Convert 24-hour format to 12-hour format
    const formatTimeTo12Hour = (timeStr) => {
      if (!timeStr) return "";
      const [hours, minutes] = timeStr.split(":");
      const hourInt = parseInt(hours, 10);
      const suffix = hourInt >= 12 ? "PM" : "AM";
      const hour12 = hourInt % 12 || 12;
      return `${hour12}:${minutes} ${suffix}`;
    };

    // Convert 12-hour format back to 24-hour format
    const formatTimeTo24Hour = (timeStr) => {
      if (!timeStr) return "";
      const [timePart, modifier] = timeStr.split(" ");
      let [hours, minutes] = timePart.split(":");

      if (hours === "12") {
        hours = modifier === "AM" ? "00" : "12";
      } else if (modifier === "PM") {
        hours = String(parseInt(hours, 10) + 12);
      }

      return `${hours}:${minutes}`;
    };

    const generateDays = () => {
      const days = [];

      // Days from previous month (grayed out)
      const prevMonthDays = new Date(year, month, 0).getDate();
      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        days.push(
          <div
            key={`prev-${i}`}
            className="p-1 text-center text-gray-400 text-sm"
          >
            {prevMonthDays - i}
          </div>
        );
      }

      // Current month days
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const isToday = currentDate.toDateString() === today.toDateString();
        const isSelected =
          tempDate && currentDate.toDateString() === tempDate.toDateString();
        const isDisabled = isDateDisabled(currentDate);

        days.push(
          <button
            key={day}
            onClick={() => !isDisabled && setTempDate(currentDate)}
            disabled={isDisabled}
            className={`p-1 w-full text-center text-sm rounded ${
              isSelected
                ? "bg-[#f29d29] text-white"
                : isToday
                ? "text-blue-500 font-medium"
                : isDisabled
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {day}
          </button>
        );
      }

      // Days from next month (grayed out)
      for (let day = 1; day <= daysFromNextMonth; day++) {
        days.push(
          <div
            key={`next-${day}`}
            className="p-1 text-center text-gray-400 text-sm"
          >
            {day}
          </div>
        );
      }

      return days;
    };

    const handlePrevMonth = () => {
      setMonth((prev) => (prev === 0 ? 11 : prev - 1));
      if (month === 0) setYear((prev) => prev - 1);
    };

    const handleNextMonth = () => {
      setMonth((prev) => (prev === 11 ? 0 : prev + 1));
      if (month === 11) setYear((prev) => prev + 1);
    };

    const handleTimeChange = (e) => {
      // Convert the 12-hour format input back to 24-hour format for storage
      const time24Hour = formatTimeTo24Hour(e.target.value);
      setTempTime(time24Hour);
    };

    const handleSave = () => {
      onDateChange(tempDate);
      onTimeChange(tempTime);
      setShowDatePicker(false);
    };

    const handleCancel = () => {
      setTempDate(date);
      setTempTime(time);
      setShowDatePicker(false);
    };

    return (
      <div className="space-y-2">
        <label className="block text-gray-700 text-sm font-medium">
          {label}
        </label>
        <div className="relative">
          <button
            onClick={() => {
              setTempDate(date);
              setTempTime(time);
              setShowDatePicker(!showDatePicker);
            }}
            className="w-full p-2 text-left border border-gray-300 rounded focus:outline-none focus:border-orange-400 text-sm bg-white flex items-center justify-between"
          >
            <span>
              {tempDate
                ? `${tempDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}, ${formatTimeTo12Hour(tempTime) || "12:00 AM"}`
                : "Select date and time"}
            </span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>

          {showDatePicker && (
            <div className="absolute z-20 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg w-[100%]">
              {/* Calendar Header */}
              <div className="flex items-center justify-between p-3 border-b">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="text-sm font-medium">
                  {monthNames[month]} {year}
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 px-2 pt-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs text-gray-500 font-medium p-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 p-2">{generateDays()}</div>

              {/* Time Selection */}
              <div className="p-3 border-t">
                <div className="text-sm font-medium mb-2">Time</div>
                <input
                  type="time"
                  value={formatTimeTo12Hour(tempTime)}
                  onChange={handleTimeChange}
                  className="border border-gray-300 rounded p-2 text-sm w-full"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex border-t p-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 text-sm bg-[#f29d29] text-white rounded ml-2 hover:bg-[#e8931f]"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  const handleFormSubmit = async () => {
    if (isLoading) return; // prevent duplicate clicks
    setIsLoading(true);

    // Validation
    if (
      !formData.meetingName ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime
    ) {
      showToast(
        "Please fill in all required fields: meeting name, start/end date and time.",
        "error"
      );
      setIsLoading(false);
      return;
    }

    // Check if end date/time is after start date/time
    const startDateTime = new Date(formData.startDate);
    startDateTime.setHours(...formData.startTime.split(":"), 0);

    const endDateTime = new Date(formData.endDate);
    endDateTime.setHours(...formData.endTime.split(":"), 0);

    if (endDateTime <= startDateTime) {
      showToast(
        "End date and time must be after start date and time.",
        "error"
      );
      setIsLoading(false);
      return;
    }

    // Format start and end times
    const startDateTimeFormatted = formatDateTime(
      formData.startDate,
      formData.startTime
    );
    const endDateTimeFormatted = formatDateTime(
      formData.endDate,
      formData.endTime
    );

    // Add timezone offset (5 hours)
    const startDateObj = new Date(startDateTimeFormatted);
    const newStartDateTime = new Date(startDateObj.getTime());

    const endDateObj = new Date(endDateTimeFormatted);
    const newEndDateTime = new Date(endDateObj.getTime());

    const startEpochMs = newStartDateTime.getTime();
    const endEpochMs = newEndDateTime.getTime();

    const newMeeting = {
      startDateTime: startDateTimeFormatted,
      startEpochMs,
      endEpochMs,
      endDateTime: endDateTimeFormatted,
      module,
      recordId: RecordId,
      createCheck: true,
      clientName: formData.clientName,
      source: formData.source,
      hostName: formData.hostName,
      recordingLink: formData.recordingLink,
      description: formData.jobDescription,
      title: formData.meetingName,
    };

    try {
      const config = {
        api_name: "Create_and_Update_Meeting_in_Zoho_Cliq",
        http_method: "POST",
        public_key: "4t6zK8jWk5KC0THFu4XPkykS2",
        payload: newMeeting,
      };

      const response = await ZOHO.CREATOR.DATA.invokeCustomApi(config);

      if (response) {
        // Create a temporary meeting object for local state
        const tempMeeting = {
          ID: response.data?.ID || `temp-${Date.now()}`, // Use response ID or temporary ID
          Meeting_Title: formData.meetingName,
          Client_Name: formData.clientName,
          Schedule_Date_Time: startDateTimeFormatted,
          Meeting_End_Time: endDateTimeFormatted,
          Meeting_Status: "Scheduled",
          Participants: formData.hostName.join(","),
          Meeting_Recording_Link: { value: formData.recordingLink },
          Description: formData.jobDescription,
          Source: { ID: formData.source },
          Module: module,
          Record_Id: RecordId,
          Created_Time: new Date().toISOString(),
        };

        // Update local state immediately
        setMeetings((prev) => [tempMeeting, ...prev]);

        showToast("Meeting created successfully!", "success");
        setShowForm(false);
        setRefreshTrigger((prev) => !prev);

        if (onMeetingCreated) {
          onMeetingCreated();
        }

        // Reset form
        setFormData({
          startDate: null,
          startTime: "",
          endDate: null,
          endTime: "",
          clientName: lead?.Name || lead?.Opportunity_Name || "",
          source:
            lead?.Lead_Source?.ID ||
            lead?.Sources?.ID ||
            lead?.Contact_Source?.ID ||
            "",
          hostName: [],
          recordingLink: "",
          jobDescription: lead?.Job_Description || "",
          meetingName: "",
        });
      } else {
        showToast("Failed to create meeting. Please try again.", "error");
      }
    } catch (err) {
      console.error("Error creating meeting:", err);
      showToast("Error creating meeting. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Users_Dev",
      });

      if (response.data && response.data.length > 0) {
        const excludedEmails = ["jahan@xpertprime.net", "info@xpertprime.com"];
        const filteredUsers = response.data.filter(
          (user) => !excludedEmails.includes(user.Email)
        );
        setUser(filteredUsers);
      } else {
        console.log("Could not fetch current employee");
      }
    } catch (err) {
      console.error("Error fetching employee:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUser();
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  function calculateEndDate(startDate, startTime) {
    const date = new Date(startDate);
    const [hours, minutes] = startTime.split(":").map(Number);
    date.setHours(hours, minutes);
    date.setMinutes(date.getMinutes() + 30);
    return date;
  }

  return (
    <div className="">
      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "" })}
        />
      )}

      <div className="bg-white rounded-lg">
        <div className="border-b border-gray-200 px-5 py-3 rounded-t-lg flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-700">
            Meeting Scheduler
          </h3>
          <button
            onClick={() => setShowForm(true)}
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
        </div>
      </div>

      <AllMeeting
        module={module}
        RecordId={RecordId}
        userId={userId}
        refreshTrigger={refreshTrigger}
        meetings={meetings}
        setMeetings={setMeetings}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {toast.show && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ show: false, message: "", type: "" })}
            />
          )}
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4 relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-xl font-semibold text-gray-800">
              Schedule Meeting
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meeting Name */}
              <div className="">
                <label className="block text-gray-700 mb-2 text-sm font-medium">
                  Meeting Name
                </label>
                <input
                  type="text"
                  name="meetingName"
                  value={formData.meetingName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none text-sm"
                  placeholder="Meeting: Client Name (Pseudonym)"
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-gray-700 mb-2 text-sm font-medium">
                  Client Name
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none bg-gray-100 text-sm"
                  readOnly
                />
              </div>

              {/* Start Date & Time */}
              <div className="rounded-lg">
                <DTPicker
                  label="Start Date & Time"
                  date={formData.startDate}
                  time={formData.startTime}
                  onDateChange={(date) =>
                    handleStartDateTimeChange(date, formData.startTime)
                  }
                  onTimeChange={(time) =>
                    handleStartDateTimeChange(formData.startDate, time)
                  }
                  required
                />
              </div>

              {/* End Date & Time (Read-Only) */}
              <div className="rounded-lg">
                <DTPicker
                  label="End Date & Time"
                  date={formData.endDate}
                  time={formData.endTime}
                  onDateChange={(date) =>
                    setFormData((prev) => ({ ...prev, endDate: date }))
                  }
                  onTimeChange={(time) =>
                    setFormData((prev) => ({ ...prev, endTime: time }))
                  }
                  required
                />
              </div>

              {/* Meeting Participants */}
              <div className="g">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Participants
                </label>
                <MultiSelectDropdown
                  options={user}
                  selectedValues={formData.hostName}
                  onChange={(selectedHosts) =>
                    setFormData({ ...formData, hostName: selectedHosts })
                  }
                  placeholder="Select Meeting Host(s)"
                />
              </div>

              {/* Lead Source */}
              <div className="">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Source
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full text-sm p-2 rounded border-gray-300 focus:ring-[#f29d29] focus:border-[#f29d29] bg-white border"
                >
                  <option value="">Select a source</option>
                  {sources.map((source, index) => (
                    <option key={index} value={source.ID}>
                      {source.Source_Name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Meeting Link */}
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-medium">
                Meeting Link
              </label>
              <input
                type="url"
                name="recordingLink"
                value={formData.recordingLink}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-orange-400 text-sm"
              />
            </div>

            {/* Job Description */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2 text-sm font-medium">
                Job Description
              </label>
              <textarea
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-orange-400 text-sm"
                placeholder="Enter job description"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSubmit}
                className="flex-1 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: isLoading ? "#e8931f" : "#f29d29",
                  boxShadow: "0 4px 15px rgba(242, 157, 41, 0.3)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
                disabled={isLoading}
                onMouseEnter={(e) => {
                  if (!isLoading) e.target.style.backgroundColor = "#e8931f";
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.target.style.backgroundColor = "#f29d29";
                }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                      />
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Meeting"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meeting;