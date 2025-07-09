/* global ZOHO */
import { useState, useEffect } from "react";
import ConvertLeadButton from "./ConvertLeadButton";
import Attachments from "../Attachment";
import Notes from "../Notes";
import Meeting from "../Meeting";
import EditLeadForm from "./EditLeadForm";
import ContactDetailsPage from "../Contact/ContactDetailsPage";
import { useTabs } from "../TabContext";
import Reminder from "../Reminder";
import toast, { Toaster } from "react-hot-toast";

const LeadDetailsPage = ({
  lead,
  onClose,
  onLeadConverted,
  onLeadUpdated,
  userId,
  currentUser,
}) => {
  const { activeTab, setActiveTab, tabs } = useTabs();
  const [activeTab1, setActiveTab1] = useState("Overview");
  const [leadId, setLeadId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [createdContact, setCreatedContact] = useState(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [refreshMeetings, setRefreshMeetings] = useState(false);
  // console.log(canEdit)
  useEffect(() => {
    if (lead && lead.ID) {
      setLeadId(lead.ID);
    }
  }, [lead]);
  console.log("lead Details > ", lead);

  const handleUpdateSuccess = (updatedData) => {
    if (onLeadUpdated) {
      onLeadUpdated({
        ...lead,
        ...updatedData,
        Lead_Source: updatedData.Lead_Source || lead.Lead_Source,
        Profile: updatedData.Profile || lead.Profile,
        Stack: updatedData.Stack || lead.Stack,
        Industry: updatedData.Industry || lead.Industry,
      });
    }
    setShowEditForm(false);
    // toast.success('Lead updated successfully!');
  };

  // Helper functions
  const getLeadName = () => {
    if (!lead) return "Unknown";
    if (lead.Name) {
      if (typeof lead.Name === "string") return lead.Name;
      if (lead.Name.first_name || lead.Name.last_name) {
        return `${lead.Name.first_name || ""} ${
          lead.Name.last_name || ""
        }`.trim();
      }
      return lead.Name.zc_display_value || "Unknown";
    }
    return lead.name || "Unknown";
  };

  const getCompany = () => {
    if (!lead) return "N/A";
    return lead.Company || lead.company || "";
  };

  const getEmail = () => {
    if (!lead) return "N/A";
    return lead.Email || lead.email || "N/A";
  };

  const getStatus = () => {
    if (!lead) return "N/A";
    return lead.Status || lead.status || lead.Lead_Status || "N/A";
  };

  const getLeadOwner = () => {
    if (!lead) return "N/A";
    if (typeof lead.Lead_Owner === "string") return lead.Lead_Owner;
    return lead.Lead_Owner?.name || lead.Lead_Owner?.zc_display_value || "N/A";
  };

  const handleMeetingCreated = () => {
    setRefreshMeetings((prev) => !prev);
  };

  const handleContactCreated = (contact) => {
    setCreatedContact(contact);
    setShowContactDetails(true);
    if (onLeadConverted) onLeadConverted();
  };

  const handleCloseContactDetails = () => {
    setShowContactDetails(false);
    onClose();
  };
  if (!lead) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 overflow-y-auto">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#f29d29] to-[#e68b1f] text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-center relative">
            <h2 className="text-2xl font-bold absolute left-1/2 transform -translate-x-1/2 drop-shadow-md">
              Lead Details
            </h2>
            <div className="flex items-center ml-auto space-x-3">
              {/* Edit Button */}
              <button
                onClick={() => setShowEditForm(true)}
                className="flex items-center mt-4 px-4 py-2 bg-white text-black rounded-lg shadow-md hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
              >
                Edit
              </button>
              {/* Convert Lead Button */}
              <ConvertLeadButton
                userId={userId}
                lead={lead}
                onConversionComplete={() => {
                  if (onLeadConverted) onLeadConverted();
                  onClose();
                }}
                onContactCreated={handleContactCreated}
                setActiveTab={setActiveTab}
                className="flex items-center px-4 py-2 !bg-white text-black rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
              >
                Convert Lead
              </ConvertLeadButton>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-3xl transition-colors duration-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Lead Name and Company */}
          <div className="mt-6 flex items-center">
            <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center text-[#f29d29] font-bold text-2xl mr-4 shadow-sm">
              {getLeadName().charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">{getLeadName()}</h3>
              <p className="text-sm opacity-90">{getCompany()}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {["Overview", "Attachments", "Notes", "Meeting", "Reminder"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab1(tab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab1 === tab
                      ? "border-[#f29d29] text-[#f29d29]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab1 === "Overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                  Basic Information
                </h3>
                <DetailItem label="Email" value={getEmail()} />
                <DetailItem label="Phone" value={lead.Phone_Number || "N/A"} />
                <DetailItem
                  label="Website"
                  value={lead.Website?.url || lead.Website?.value || "N/A"}
                  isLink
                />
              </div>

              {/* Lead Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                  Lead Details
                </h3>
                <DetailItem label="Status" value={getStatus()}>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      getStatus() === "New"
                        ? "bg-blue-100 text-blue-800"
                        : getStatus() === "Contacted"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {getStatus()}
                  </span>
                </DetailItem>
                <DetailItem
                  label="Lead Source"
                  value={lead.Lead_Source?.zc_display_value || "N/A"}
                />
                <DetailItem label="Rating" value={lead.Rating || "N/A"} />
              </div>

              {/* Job Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                  Job Information
                </h3>
                <DetailItem label="Job Title" value={lead.Job_Title || "N/A"} />
                <DetailItem
                  label="Job Stack"
                  value={lead.Stack.zc_display_value || "N/A"}
                />
                <DetailItem
                  label="No of Connects"
                  value={lead.No_of_Connects || "0"}
                />
                <DetailItem
                  label="Job Link"
                  value={lead.Job_Link?.url || lead.Job_Link?.value || "N/A"}
                  isLink
                />
                <DetailItem
                  label="Select Profile"
                  value={lead.Profile.zc_display_value || "N/A"}
                />
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                  Additional Information
                </h3>
                <DetailItem
                  label="Industry"
                  value={lead.Industry.Profile_Name || "N/A"}
                />
                <DetailItem label="Lead Owner" value={getLeadOwner()} />
                <DetailItem
                  label="Created Date"
                  value={
                    lead.Created_Time || lead.Added_Time
                      ? new Date(
                          lead.Created_Time || lead.Added_Time
                        ).toLocaleString()
                      : "N/A"
                  }
                />
              </div>

              {/* Add Job Description here */}
              <div className="space-y-4 w-[200%]">
                <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                  Job Description
                </h3>
                <DetailItem value={lead.Job_Description || "N/A"} />
              </div>
            </div>
          )}
          {activeTab1 === "Attachments" && leadId != null && (
            <Attachments
              module="Leads"
              RecordId={leadId}
              currentUser={currentUser}
            />
          )}

          {activeTab1 === "Notes" && (
            <Notes module="Leads" RecordId={leadId} currentUser={currentUser} />
          )}

          {activeTab1 === "Reminder" && (
            <Reminder
              module="Leads"
              RecordId={leadId}
              currentUser={currentUser}
              comment={true}
            />
          )}
          {activeTab1 === "Meeting" && (
            <Meeting
              module="Leads"
              RecordId={leadId}
              currentUser={currentUser}
              lead={lead}
              userId={userId}
              onMeetingCreated={handleMeetingCreated}
              refreshTrigger={refreshMeetings} // Pass the refresh trigger
            />
          )}
          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {showEditForm && (
        <EditLeadForm
          lead={lead}
          onClose={() => setShowEditForm(false)}
          onUpdateSuccess={handleUpdateSuccess}
          userId={userId}
        />
      )}
      {showContactDetails && createdContact && (
        <ContactDetailsPage
          contact={createdContact}
          onClose={handleCloseContactDetails}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

const DetailItem = ({ label, value, children, isLink = false }) => {
  const displayValue =
    value !== undefined && value !== null ? String(value) : "N/A";

  if (children) {
    return (
      <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{children}</dd>
      </div>
    );
  }

  if (isLink && displayValue !== "N/A") {
    const url = value.startsWith("http") ? value : `https://${value}`;
    return (
      <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f29d29] hover:underline"
          >
            {displayValue}
          </a>
        </dd>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{displayValue}</dd>
    </div>
  );
};

export default LeadDetailsPage;
