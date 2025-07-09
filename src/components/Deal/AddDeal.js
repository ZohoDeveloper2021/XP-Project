/* global ZOHO */
import { useState, useEffect } from "react";

const AddDeal = ({
  onClose,
  onDealAdded,
  currentUser,
  userId,
  permissions,
}) => {
  const [formData, setFormData] = useState({
    dealName: "",
    account: "",
    stage: "On Boarded",
    closeDate: "",
    source: "",
    amount: "",
    budgetConfirmed: false,
    discoveryCompleted: false,
    roiAnalysisCompleted: false,
    // lossReason: '',
    opportunityOwner: "",
    isConverted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState([]);
  const [source, setSource] = useState([]);
  const [contact, setContact] = useState([]);
  const [profile, setProfile] = useState([]);
  // const [userId, setUserId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const isTeamLead = permissions?.includes("Team Lead");
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  let configContact = {
    app_name: "lead-management-system",
    report_name: "All_Contacts_Dev",
    max_records: 1000,
  };
   if (isTeamLead === false) {
        configContact.criteria = `Contact_Owner.Email == "${currentUser}"`;
    }

  async function fetchContact() {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords(configContact);
      const records = response.data || [];
      setContact(records);
    } catch (error) {
      console.error("Error fetching contact from Zoho:", error);
      throw error;
    }
  }

  let configAccount = {
    app_name: "lead-management-system",
    report_name: "All_Accounts_Dev",
    max_records: 1000,
  };
  if (isTeamLead === false) {
        configAccount.criteria = `Account_Owner.Email == "${currentUser}"`;
    }

  async function fetchAccount() {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords(configAccount);
      const records = response.data || [];
      setAccount(records);
    } catch (error) {
      console.error("Error fetching account from Zoho:", error);
      throw error;
    }
  }

  let configProfile = {
    app_name: "lead-management-system",
    report_name: "All_Profiles_Dev",
    max_records: 1000,
  };

  async function fetchProfile() {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords(configProfile);
      const records = response.data || [];
      setProfile(records);
    } catch (error) {
      console.error("Error fetching profile from Zoho:", error);
      throw error;
    }
  }

  let configSource = {
    app_name: "lead-management-system",
    report_name: "All_Sources_Dev",
    max_records: 1000,
  };

  async function fetchSource() {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords(configSource);
      const records = response.data || [];
      setSource(records);
    } catch (error) {
      console.error("Error fetching Source from Zoho:", error);
      throw error;
    }
  }
  console.log(source);
  useEffect(() => {
    fetchContact();
    fetchAccount();
    fetchProfile();
    fetchSource();
  }, []);

  const formatDate = (isoDateStr) => {
    const [year, month, day] = isoDateStr.split("-");
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
    const monthIndex = parseInt(month, 10) - 1;
    return `${day}-${monthNames[monthIndex]}-${year}`;
  };

  // File handling functions
  const isImageFile = (filename) => {
    if (!filename) return false;
    const extension = filename.split(".").pop().toLowerCase();
    const imageExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "svg",
      "heic",
      "webp",
    ];
    return imageExtensions.includes(extension);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (dealId) => {
    if (!selectedFiles.length) return;

    setIsUploadingFiles(true);

    try {
      for (const file of selectedFiles) {
        // Create the attachment record
        const recordPayload = {
          data: {
            Record_Id: dealId,
            Module_Mapping: "Opportunities",
          },
        };

        const response = await ZOHO.CREATOR.DATA.addRecords({
          app_name: "lead-management-system",
          form_name: "Attachments",
          payload: recordPayload,
        });

        if (response.code === 3000) {
          const recordId = response.data.ID;
          const fieldName = isImageFile(file.name)
            ? "File_upload"
            : "File_upload";

          const fileUploadConfig = {
            app_name: "lead-management-system",
            report_name: "All_Attachments_Dev",
            id: recordId,
            field_name: fieldName,
            file: file,
          };

          // Upload the actual file
          await ZOHO.CREATOR.FILE.uploadFile(fileUploadConfig);
        }
      }
    } catch (error) {
      console.error("Error uploading attachments:", error);
      throw error;
    } finally {
      setIsUploadingFiles(false);
    }
  };

  //   const createHistoryRecord = async (dealId) => {
  //   try {
  //     const currentDateTime = new Date().toISOString();

  //     const recordData = {
  //       Opportunity_Name: dealId,
  //       Stage_Name: "On Boarded",
  //       Modified_Time: currentDateTime,
  //       User: userId
  //     };

  //     const config = {
  //       app_name: 'lead-management-system',
  //       form_name: 'Opportunity_Stage_History',
  //       payload: {
  //         data: recordData
  //       }
  //     };
  // console.log(config)
  //     const res = await ZOHO.CREATOR.DATA.addRecords(config);
  //     console.log(res)
  //   } catch (err) {
  //     console.error('Error creating history record:', err);
  //     // Don't throw error here as we don't want to fail the main operation
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare the deal data for Zoho Creator
      const dealData = {
        Opportunity_Name: formData.dealName,
        Accounts: formData.accountSource,
        Contacts: formData.contactSource,
        Select_Profile: formData.profileSource,
        Sources: formData.source,
        Close_Date: formData.closeDate ? formatDate(formData.closeDate) : "",
        Amount: parseFloat(formData.amount) || 0,
        Budget_Confirmed: formData.budgetConfirmed,
        Discovery_Completed: formData.discoveryCompleted,
        ROI_Analysis_Completed: formData.roiAnalysisCompleted,
        // Loss_Reason: formData.lossReason,
        Opportunity_Owner: userId,
        Is_Converted: formData.isConverted,
      };

      // Call Zoho Creator API to add the deal
      const response = await ZOHO.CREATOR.DATA.addRecords({
        app_name: "lead-management-system",
        form_name: "Opportunities",
        payload: {
          data: dealData,
        },
      });

      if (response.code === 3000) {
        //   await createHistoryRecord(
        //   response.data.ID,
        // );
        // Upload attachments if any
        if (selectedFiles.length > 0) {
          await uploadAttachments(response.data.ID);
        }
        onDealAdded();
      } else {
        throw new Error(response.message || "Failed to add deal");
      }
    } catch (err) {
      console.error("Error adding deal:", err);
      setError(err.message || "Failed to add deal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-gray-100 border border-gray-300 rounded-lg shadow-lg w-full max-w-2xl p-4 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-[#f29d29]">Add New Deal</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-xl"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            Error: {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Opportunity Section */}
          <div className="md:col-span-2 bg-gray-50 p-3 rounded">
            <h3 className="text-lg font-medium text-[#f29d29] mb-2">
              Opportunity
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Deal Name*
                </label>
                <input
                  type="text"
                  name="dealName"
                  value={formData.dealName}
                  onChange={handleChange}
                  required
                  className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
                />
              </div>

              <div className="bg-gray-50 p-2 rounded">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Account
                </label>
                <select
                  name="accountSource"
                  value={formData.accountSource}
                  onChange={handleChange}
                  className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
                >
                  <option value="">Select a Account</option>
                  {account.map((account, index) => (
                    <option key={index} value={account.ID}>
                      {account.Account_Name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contact
                </label>
                <select
                  name="contactSource"
                  value={formData.contactSource}
                  onChange={handleChange}
                  className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
                >
                  <option value="">Select a Contact</option>
                  {contact.map((contact, index) => (
                    <option key={index} value={contact.ID}>
                      {contact.Name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Source
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
                >
                  <option value="">Select a Source</option>
                  {source.map((src, index) => (
                    <option key={index} value={src.ID}>
                      {src.Source_Name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Accounts Section */}
          <div className="md:col-span-2 bg-gray-50 p-3 rounded">
            <h3 className="text-lg font-medium text-[#f29d29] mb-2">
              Accounts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="budgetConfirmed"
                  checked={formData.budgetConfirmed}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#f29d29] focus:ring-[#f29d29] border-gray-300 rounded"
                />
                <label className="ml-2 block text-xs font-medium text-gray-700">
                  Budget Confirmed
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="discoveryCompleted"
                  checked={formData.discoveryCompleted}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#f29d29] focus:ring-[#f29d29] border-gray-300 rounded"
                />
                <label className="ml-2 block text-xs font-medium text-gray-700">
                  Discovery Completed
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="roiAnalysisCompleted"
                  checked={formData.roiAnalysisCompleted}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#f29d29] focus:ring-[#f29d29] border-gray-300 rounded"
                />
                <label className="ml-2 block text-xs font-medium text-gray-700">
                  ROI Analysis Completed
                </label>
              </div>
            </div>
          </div>

          {/* Stage Section */}
          <div className="md:col-span-2 bg-gray-50 p-3 rounded">
            <h3 className="text-lg font-medium text-[#f29d29] mb-2">
              Profile & Amount
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-50 p-2 rounded">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Profile *
                </label>
                <select
                  name="profileSource"
                  value={formData.profileSource}
                  onChange={handleChange}
                  className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
                >
                  <option value="">Select a Profile</option>
                  {profile.map((profile, index) => (
                    <option key={index} value={profile.ID}>
                      {profile.Profile_Name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Loss Reason</label>
                <select
                  name="lossReason"
                  value={formData.lossReason}
                  onChange={handleChange}
                  className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
                >
                  <option value="">Select</option>
                  <option value="Price">Price</option>
                  <option value="No Decision / Non-Responsive">No Decision / Non-Responsive</option>
                  <option value="No Budget / Lost Funding">No Budget / Lost Funding</option>
                  <option value="Lost to Competitor">Lost to Competitor</option>
                  <option value="Other">Other</option>
                </select>
              </div> */}
            </div>
          </div>

          {/* File Upload Section */}
          <div className="md:col-span-2 bg-gray-50 p-3 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Attachments
            </label>
            <div className="space-y-2">
              {selectedFiles.length > 0 ? (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded bg-white"
                    >
                      <div className="flex items-center space-x-2">
                        {isImageFile(file.name) ? (
                          <div className="w-8 h-8 rounded overflow-hidden bg-gray-100">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Preview"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                              />
                            </svg>
                          </div>
                        )}
                        <span className="text-sm truncate max-w-xs">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-md cursor-pointer transition-colors hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">
                        <span className="font-semibold text-[#f29d29]">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOCX, JPG, PNG up to 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.svg,.heic,.webp"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingFiles}
              className="bg-[#f29d29] hover:bg-[#e08e22] text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting || isUploadingFiles ? "Adding..." : "Add Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeal;
