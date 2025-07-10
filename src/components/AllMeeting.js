/* global ZOHO */
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BiSolidEdit } from "react-icons/bi";
import toast, { Toaster } from "react-hot-toast";
import DTPicker from "./DateTimePicker";
import { format } from "date-fns";

const AllMeeting = (RecordId) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showRemarkForm, setShowRemarkForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [formData, setFormData] = useState({ time: "", endTime: "" });
  const [remarkData, setRemarkData] = useState({ remark: "" });
  const [statusData, setStatusData] = useState({ status: "", remark: "" });
  const [meetingId, setMeetingId] = useState("");
  const [existingRemarkId, setExistingRemarkId] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // New state for update loading

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      let config = {
        app_name: "lead-management-system",
        report_name: "All_Meetings_Dev",
        criteria: `(Record_Id == "${RecordId.RecordId}" || Accounts == "${RecordId.RecordId}" || Opportunities == "${RecordId.RecordId}")`,
      };
      const response = await ZOHO.CREATOR.DATA.getRecords(config);
      if (response.data && response.data.length > 0) {
        setMeetings(response.data);
        setMeetingId(response.data.ID);
      } else {
        setMeetings([]);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Users_Dev",
      });
      if (response.data && response.data.length > 0) {
        setUser(response.data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUser();

    if (!hasFetched && RecordId) {
      fetchMeetings();
      setHasFetched(true);
    }
  }, [RecordId, RecordId?.refreshTrigger]);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDisplayTime = (timeString) => {
    if (!timeString) return "";

    try {
      // Extract time part if it includes a date (e.g., "01-Jan-2023 14:30:00")
      const timeOnly = timeString.includes(" ")
        ? timeString.split(" ")[1]
        : timeString;

      // Split into hours and minutes
      const [hours, minutes] = timeOnly.split(":");
      const hourInt = parseInt(hours, 10);

      // Convert to 12-hour format
      const period = hourInt >= 12 ? "PM" : "AM";
      const hour12 = hourInt % 12 || 12; // Convert 0 to 12 for 12 AM

      return `${hour12}:${minutes.substring(0, 2)} ${period}`;
    } catch (error) {
      // Fallback to original format if conversion fails
      if (timeString.includes(" ")) {
        return timeString.split(" ")[1]?.substring(0, 5) || timeString;
      }
      return timeString.substring(0, 5);
    }
  };

  const getMeetingStatus = (meeting) => {
    if (meeting.Meeting_Status) {
      return meeting.Meeting_Status.toLowerCase();
    }

    if (!meeting.Schedule_Date_Time) return "unknown";

    try {
      const meetingDate = new Date(meeting.Schedule_Date_Time);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const meetingDay = new Date(
        meetingDate.getFullYear(),
        meetingDate.getMonth(),
        meetingDate.getDate()
      );

      if (meetingDay.getTime() === today.getTime()) {
        // Same day - check time
        if (meetingDate.getTime() < now.getTime()) {
          return "completed";
        } else {
          return "today";
        }
      } else if (meetingDate.getTime() < now.getTime()) {
        return "overdue";
      } else {
        return "upcoming";
      }
    } catch (error) {
      return "unknown";
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "overdue":
        return {
          badge: "bg-red-100 text-red-800 border border-red-200",
          icon: "⚠️",
          text: "Overdue",
          cardBorder: "border-red-200",
          cardShadow: "shadow-red-100",
        };
      case "in progress":
        return {
          badge: "bg-yellow-100 text-yellow-800 border border-yellow-200",
          icon: "🔔",
          text: "In Progress",
          cardBorder: "border-yellow-200",
          cardShadow: "shadow-yellow-100",
        };
      case "scheduled":
        return {
          badge: "bg-green-100 text-green-800 border border-green-200",
          icon: "📅",
          text: "Scheduled",
          cardBorder: "border-green-200",
          cardShadow: "shadow-green-100",
        };
      case "completed":
        return {
          badge: "bg-gray-100 text-gray-800 border border-gray-200",
          icon: "✅",
          text: "Completed",
          cardBorder: "border-gray-200",
          cardShadow: "shadow-gray-100",
        };
      case "cancelled":
        return {
          badge: "bg-purple-100 text-purple-800 border border-purple-200",
          icon: "❌",
          text: "Cancelled",
          cardBorder: "border-purple-200",
          cardShadow: "shadow-purple-100",
        };
      case "rescheduled":
        return {
          badge: "bg-blue-100 text-blue-800 border border-blue-200",
          icon: "🔄",
          text: "Rescheduled",
          cardBorder: "border-blue-200",
          cardShadow: "shadow-blue-100",
        };
      default:
        return {
          badge: "bg-gray-100 text-gray-800 border border-gray-200",
          icon: "📋",
          text: "Meeting",
          cardBorder: "border-gray-200",
          cardShadow: "shadow-gray-100",
        };
    }
  };

  const formatDateTimeForAPI = (date, time) => {
    if (!date || !time) return "";

    const [hours, minutes] = time.split(":");
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    newDate.setSeconds(0);

    const day = String(newDate.getDate()).padStart(2, "0");
    const monthNames = [
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
    const month = monthNames[newDate.getMonth()];
    const year = newDate.getFullYear();
    const hour = String(newDate.getHours()).padStart(2, "0");
    const minute = String(newDate.getMinutes()).padStart(2, "0");
    const second = String(newDate.getSeconds()).padStart(2, "0");

    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
  };

  const formatDateTime = (date, time) => {
    const [hours, minutes] = time.split(":");
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    return newDate.toISOString();
  };

  const parseMeetingDateTime = (dateTimeString) => {
    if (!dateTimeString) return new Date(); // Fallback to current date if no date provided
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return new Date(); // Fallback to current date if invalid
      return date;
    } catch (error) {
      return new Date(); // Fallback to current date if parsing fails
    }
  };

  const extractTimeFromDateTime = (dateTimeString) => {
    if (!dateTimeString) return "00:00"; // Default time if not provided
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return "00:00";

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch (error) {
      return "00:00";
    }
  };

  const handleEditClick = (meeting) => {
    setSelectedMeeting(meeting);

    const meetingStartDate = parseMeetingDateTime(meeting.Schedule_Date_Time);
    const meetingEndDate = parseMeetingDateTime(meeting.Meeting_End_Time);
    const startTime = extractTimeFromDateTime(meeting.Schedule_Date_Time);
    const endTime = extractTimeFromDateTime(meeting.Meeting_End_Time);

    setSelectedDate(meetingStartDate);  // Add this
  setSelectedEndDate(meetingEndDate); 

    setFormData({
      startDate: meetingStartDate,
      endDate: meetingEndDate,
      time: startTime,
      endTime: endTime,
      updateReason: meeting.Reason_For_Time_Change || "", // Initialize with existing reason if available
    });

    setShowForm(true);
  };

  const handleStatusChange = async (meeting, newStatus) => {
    try {
      const updateData = {
        Meeting_Status: newStatus,
      };

      const config = {
        app_name: "lead-management-system",
        report_name: "All_Meetings_Dev",
        id: meeting.ID,
        payload: {
          data: updateData,
        },
      };

      await ZOHO.CREATOR.DATA.updateRecordById(config);

      // Update local state immediately for a responsive UI
      setMeetings((prevMeetings) =>
        prevMeetings.map((m) =>
          m.ID === meeting.ID ? { ...m, Meeting_Status: newStatus } : m
        )
      );

      toast.success(`Status changed to ${newStatus}`, { duration: 1000 });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleRemarkClick = async (meeting) => {
    if (
      meeting.Meeting_Status?.toLowerCase() !== "completed" &&
      getMeetingStatus(meeting) !== "completed"
    ) {
      toast.error(`You can only add remarks for completed meetings`, {
        duration: 1000,
      });
      return;
    }

    setSelectedMeeting(meeting);
    setMeetingId(meeting.ID);

    try {
      const config = {
        app_name: "lead-management-system",
        report_name: "All_Remarks_Dev",
        criteria: `Meetings == ${meeting.ID}`,
        sort_order: "desc",
      };
      const response = await ZOHO.CREATOR.DATA.getRecords(config);

      if (response.data) {
        setRemarkData({
          remarks: response.data,
          newRemark: "",
        });
      } else {
        setRemarkData({
          remarks: [],
          newRemark: "",
        });
      }
    } catch (error) {
      console.error("Error fetching remarks:", error);
      setRemarkData({
        remarks: [],
        newRemark: "",
      });
    }

    setShowRemarkForm(true);
  };

  const handleStatusClick = (meeting) => {
    setSelectedMeeting(meeting);
    setStatusData({
      status: meeting.Meeting_Status || getMeetingStatus(meeting),
      remark: meeting.Meeting_Remarks || "",
    });
    setShowStatusForm(true);
  };

  const handleRemarkSubmit = async () => {
    if (!remarkData.newRemark?.trim()) {
      return;
    }

    const newRemarkText = remarkData.newRemark.trim();

    try {
      const payload = {
        Remarks: newRemarkText,
        Users: RecordId.userId,
        Module: RecordId.module,
        Record_ID: RecordId.RecordId,
        Meetings: selectedMeeting.ID,
      };

      const config = {
        app_name: "lead-management-system",
        form_name: "Remarks",
        payload: {
          data: payload,
        },
      };

      const optimisticRemark = {
        ...payload,
        ID: Date.now(),
        Created_Time: new Date().toISOString(),
      };

      setRemarkData((prev) => ({
        ...prev,
        remarks: [optimisticRemark, ...prev.remarks],
        newRemark: "",
        showAddForm: false,
      }));

      await ZOHO.CREATOR.DATA.addRecords(config);

      const configLead = {
        app_name: "lead-management-system",
        report_name: "All_Leads_Dev",
        id: RecordId.RecordId,
        payload: {
          data: {
            Remarks_Done: true,
           

          },
        },
      };
      const createRemarks = await ZOHO.CREATOR.DATA.updateRecordById(configLead);
  

      await new Promise((resolve) => setTimeout(resolve, 500));

      const remarksConfig = {
        app_name: "lead-management-system",
        report_name: "All_Remarks_Dev",
        criteria: `Meetings == ${selectedMeeting.ID}`,
      };

      const response = await ZOHO.CREATOR.DATA.getRecords(remarksConfig);

      if (response.data) {
        setRemarkData((prev) => ({
          ...prev,
          remarks: response.data,
          newRemark: "",
          showAddForm: false,
        }));
      }

      fetchMeetings();
    } catch (error) {
      console.error("Error saving remark:", error);
      alert("Failed to save remark");
    }
  };

  const handleFormSubmit = async () => {
    
    if (selectedDate && formData.time && selectedEndDate && formData.endTime && formData.updateReason) {
      console.log('Form Data');
      const startDateTime = formatDateTimeForAPI(selectedDate, formData.time);
      const endDateTime = formatDateTimeForAPI(selectedEndDate, formData.endTime);
      const startDateTimeISO = formatDateTime(selectedDate, formData.time);
      const endDateTimeISO = formatDateTime(selectedEndDate, formData.endTime);

      const newStart = new Date(new Date(startDateTimeISO).getTime());
      const newEnd = new Date(new Date(endDateTimeISO).getTime());
console.log("startDateTime", startDateTime)
console.log("endDateTime", endDateTime)
console.log(selectedMeeting)
      const payload = {
        clientName: selectedMeeting.Client_Name ? `Meeting: ${selectedMeeting.Client_Name}` :"",
        startDateTime: startDateTime, 
        startEpochMs: newStart.getTime(),
        endDateTime: endDateTime,
        endEpochMs: newEnd.getTime(),
        eventId: selectedMeeting.Meeting_Id,
        recordId: RecordId.RecordId,
        module: selectedMeeting.Module,
        createCheck: false,
        reason: formData.updateReason,
        source: selectedMeeting.Source?.ID || '',
        recordingLink: selectedMeeting.Meeting_Recording_Link?.value || '',
        description: selectedMeeting.Description || '',
        title: selectedMeeting.Meeting_Title,
        chat_id: selectedMeeting.Cliq_Chat_Id,
        calendar_id: selectedMeeting.Calender_ID
      };

      console.log('Payload with formatted datetime:', payload);
      setIsUpdating(true);
      try {
        const config = {
          api_name: 'Create_and_Update_Meeting_in_Zoho_Cliq',
          http_method: 'POST',
          public_key: '4t6zK8jWk5KC0THFu4XPkykS2',
          payload
        };
        const response = await ZOHO.CREATOR.DATA.invokeCustomApi(config);
        console.log(response)
        if (response) {
          setShowForm(false);
          fetchMeetings();
        }
      } catch (err) {
        console.error('Error updating meeting:', err);
      } finally {
      setIsUpdating(false);
    }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f29d29]"></div>
      </div>
    );
  }

  return (
    <>
      {/* <Toaster position="top-center" toastOptions={{ duration: 2000 }} /> */}
      <div className="bg-gray-50 ">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-base">
              Manage your meetings with ease and track their status
            </p>
          </div>

          <div className="space-y-4">
            {meetings.map((meeting, index) => {
              const status = getMeetingStatus(meeting);
              const statusStyle = getStatusStyle(status);

              const participantEmails = meeting.Participants
                ? meeting.Participants.split(",")
                    .map((email) => email.trim())
                    .filter((email) => email && email.length > 0)
                    .filter(
                      (email, index, array) => array.indexOf(email) === index
                    )
                : [];

              return (
                <div key={index} className="group">
                  <div
                    className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border ${statusStyle.cardBorder} overflow-hidden ${statusStyle.cardShadow}`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-lg font-bold text-gray-800">
                              {meeting.Client_Name || "Meeting"}
                            </h2>
                            <div
                              className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.badge}`}
                            >
                              <span>{statusStyle.icon}</span>
                              <span>{statusStyle.text}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 mb-3">
                            <div className="flex items-center space-x-1 text-gray-600 bg-orange-50 px-2 py-1 rounded-md">
                              <span className="text-sm">📅</span>
                              <span className="font-medium text-sm">
                                {formatDisplayDate(meeting.Schedule_Date_Time)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-600 bg-blue-50 px-2 py-1 rounded-md">
                              <span className="text-sm">🕒</span>
                              <span className="font-medium text-sm">
                                {formatDisplayTime(meeting.Schedule_Date_Time)}{" "}
                                - {formatDisplayTime(meeting.Meeting_End_Time)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <div className="flex flex-col space-y-1">
                            <label className="text-xs font-medium text-gray-700">
                              Meeting Status
                            </label>
                            <select
                              value={meeting.Meeting_Status || status}
                              onChange={(e) =>
                                handleStatusChange(meeting, e.target.value)
                              }
                              className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#f29d29] focus:border-transparent"
                            >
                              <option value="None">None</option>
                              <option value="Scheduled">Scheduled</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                          <button
                            onClick={() => handleRemarkClick(meeting)}
                            className="bg-[#f29d29] hover:bg-orange-400 text-white font-medium py-1.5 px-3 rounded-md transition-all duration-300 flex items-center space-x-1 shadow-sm hover:shadow-md text-xs mt-5 mx-3"
                          >
                            <span>Meeting Remarks</span>
                          </button>
                          <button
                            onClick={() => handleEditClick(meeting)}
                            className="bg-[#f29d29] hover:bg-orange-400 text-white font-medium py-[5px] px-2 rounded-md transition-all duration-300 flex items-center space-x-1 shadow-sm hover:shadow-md text-xs mt-5"
                          >
                            <BiSolidEdit className="text-[17px]" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-3 ">
                        <div className="flex items-center space-x-1 mb-2">
                          <span className="text-xs font-semibold text-gray-700">
                            Meeting Participants:
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            {participantEmails.length} participant
                            {participantEmails.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {participantEmails.map((email, i) => {
                            const userInfo = user.find(
                              (u) =>
                                u.Email?.toLowerCase() === email.toLowerCase()
                            );
                            const displayName = userInfo
                              ? userInfo.Name
                              : email;
                            return (
                              <div
                                key={`${email}-${i}`}
                                className="flex items-center bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-md px-2 py-1.5 hover:shadow-sm transition-shadow"
                              >
                                <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2 shadow-sm">
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs text-gray-700 font-medium">
                                  {displayName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {meeting.Reason_For_Time_Change && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs font-bold text-amber-800">
                              Reason For Meeting Update:
                            </span>
                          </div>
                          <p className="text-amber-700 text-xs leading-relaxed">
                            {meeting.Reason_For_Time_Change}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {meetings.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto border border-gray-100">
                <div className="text-6xl mb-6">📅</div>
                <h3 className="text-xl font-bold text-gray-700 mb-3">
                  No meetings found
                </h3>
                <p className="text-gray-500">
                  Your meeting schedule is currently empty.
                </p>
              </div>
            </div>
          )}

          {/* Remark Modal */}
          {showRemarkForm && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4 relative max-h-[90vh] flex flex-col">
                <button
                  onClick={() => setShowRemarkForm(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
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

                <div className="mb-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        Meeting Remarks
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Meeting:{" "}
                        <span className="font-medium">
                          {selectedMeeting?.Client_Name}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setRemarkData({ ...remarkData, showAddForm: true })
                      }
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors shadow-md"
                    >
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {remarkData.remarks && remarkData.remarks.length > 0 ? (
                    <div className="space-y-4">
                      {remarkData.remarks.map((remark, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {remark.Users?.Name?.charAt(0) || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-gray-800 text-sm">
                                  {remark.Users?.Name || "Unknown User"}
                                </h4>
                              </div>
                              <p className="text-gray-600 text-xs mb-2">
                                {new Date(
                                  remark.Added_Time
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {remark.Remarks}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 h-full flex items-center justify-center flex-col">
                      <svg
                        className="w-12 h-12 mx-auto mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <p className="text-sm">No remarks added yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Click the + button to add your first remark
                      </p>
                    </div>
                  )}
                </div>

                {/* Add New Remark Form */}
                {remarkData.showAddForm && (
                  <div className="mt-6 border-t pt-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Add New Remark
                        </label>
                        <textarea
                          value={remarkData.newRemark || ""}
                          onChange={(e) =>
                            setRemarkData({
                              ...remarkData,
                              newRemark: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                          placeholder="Enter your remark here..."
                          required
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() =>
                            setRemarkData({
                              ...remarkData,
                              showAddForm: false,
                              newRemark: "",
                            })
                          }
                          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            handleRemarkSubmit();
                            setRemarkData({
                              ...remarkData,
                              showAddForm: false,
                            });
                          }}
                          disabled={!remarkData.newRemark?.trim()}
                          className={`flex-1 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                            !remarkData.newRemark?.trim()
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-orange-500 hover:bg-orange-600"
                          }`}
                        >
                          Add Remark
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Close button when not adding new remark */}
                {!remarkData.showAddForm && (
                  <div className="flex justify-end pt-6">
                    <button
                      onClick={() => setShowRemarkForm(false)}
                      className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit Meeting Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4 relative space-y-6 max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowForm(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
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

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Edit Meeting
                  </h3>
                  <p className="text-gray-600">
                    Editing:{" "}
                    <span className="font-semibold">
                      {selectedMeeting?.Client_Name}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <DTPicker
                          label="Start Date & Time"
                          date={formData.startDate}
                          time={formData.time}
                          onDateChange={(date) => {
                            setSelectedDate(date); // Add this
                            setFormData((prev) => ({ ...prev, startDate: date }));
                          }}
                          onTimeChange={(time) =>
                            setFormData((prev) => ({ ...prev, time: time }))
                          }
                          onStartTimeChange={(endTime) => {
                            setSelectedEndDate(endTime); // Add this
                            setFormData((prev) => ({
                              ...prev,
                              endDate: endTime,
                              endTime: format(endTime, "HH:mm"),
                            }));
                          }}
                          isStartDateTime={true}
                          required
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <DTPicker
                          label="End Date & Time"
                          date={formData.endDate}
                          time={formData.endTime}
                          onDateChange={(date) => {
                            setSelectedEndDate(date); // Add this
                            setFormData((prev) => ({ ...prev, endDate: date }));
                          }}
                          onTimeChange={(time) =>
                            setFormData((prev) => ({ ...prev, endTime: time }))
                          }
                          required
                        />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-gray-700 text-sm font-semibold">
                      Reason for Update *
                    </label>
                    <textarea
                      value={formData.updateReason || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          updateReason: e.target.value,
                        })
                      }
                      className={`w-full border ${
                        !formData.updateReason && formData.submitAttempted
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      placeholder="Please specify the reason for updating this meeting..."
                      required
                    />
                    {!formData.updateReason && formData.submitAttempted && (
                      <p className="text-red-500 text-xs mt-1">
                        This field is required
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        submitAttempted: false,
                      }));
                      setShowForm(false);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFormSubmit}
                    disabled={
                      isUpdating ||
                      !formData.updateReason?.trim() || // Check if reason is not empty
                      !formData.startDate || // Check if start date is set
                      !formData.time || // Check if start time is set
                      !formData.endDate || // Check if end date is set
                      !formData.endTime // Check if end time is set
                    }
                    className={`flex-1 text-white py-3 rounded-lg font-medium transition-colors ${
                      isUpdating ||
                      !formData.updateReason?.trim() ||
                      !formData.startDate ||
                      !formData.time ||
                      !formData.endDate ||
                      !formData.endTime
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    {isUpdating ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Updating...
                      </div>
                    ) : (
                      "Update Meeting"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AllMeeting;
