/* global ZOHO */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const EditLeadForm = ({ lead, onClose, onUpdateSuccess, userId }) => {
  const [formData, setFormData] = useState({
    leadName: "",
    email: "",
    phone: "",
    company: "",
    leadStatus: "New",
    leadSource: "",
    rating: "Cold",
    industry: "",
    website: "",
    jobDescription: "",
    jobTitle: "",
    noOfConnects: "",
    jobLink: "",
    selectProfile: "",
    jobStack: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sources, setSources] = useState([]);
  const [profile, setProfile] = useState([]);
  const [industry, setIndustry] = useState([]);
  const [job, setJob] = useState([]);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  // Attachment related states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  let config = {
    app_name: "lead-management-system",
    report_name: "All_Sources_Dev",
    max_records: 1000,
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

  let profileConfig = {
    app_name: "lead-management-system",
    report_name: "All_Profiles_Dev",
    max_records: 1000,
  };

  async function fetchProfile() {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords(profileConfig);
      const records = response.data || [];
      setProfile(records);
    } catch (error) {
      console.error("Error fetching profile data from Zoho:", error);
      throw error;
    }
  }

  let jobConfig = {
    app_name: "lead-management-system",
    report_name: "All_Stacks_Dev",
    max_records: 1000,
  };

  async function fetchJob() {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords(jobConfig);
      const records = response.data || [];
      setJob(records);
    } catch (error) {
      console.error("Error fetching Job Stack data from Zoho:", error);
      throw error;
    }
  }

  let industryConfig = {
    app_name: "lead-management-system",
    report_name: "All_Industries_Dev",
    max_records: 1000,
  };

  async function fetchIndustry() {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords(industryConfig);
      const records = response.data || [];
      setIndustry(records);
    } catch (error) {
      console.error("Error fetching Job Stack data from Zoho:", error);
      throw error;
    }
  }

  useEffect(() => {
    if (lead) {
      setFormData({
        leadName: lead.Name || "",
        email: lead.Email || "",
        phone: lead.Phone_Number || "",
        company: lead.Company || "",
        leadStatus: lead.Lead_Status || "New",
        leadSource: lead.Lead_Source?.ID || lead.Lead_Source || "",
        rating: lead.Rating || "Cold",
        industry: lead.Industry?.ID || "",
        website: lead.Website?.url?.trim() || "",
        jobDescription: lead.Job_Description || "",
        jobTitle: lead.Job_Title || "",
        noOfConnects: lead.No_of_Connects || "",
        jobLink: lead.Job_Link?.url?.trim() || "",
        selectProfile: lead.Profile?.ID || lead.Profile || "",
        jobStack: lead.Stack?.ID || lead.Stack || "",
      });
    }

    fetchSource();
    fetchProfile();
    fetchJob();
    fetchIndustry();
  }, [lead]);

  const leadStatusOptions = [
    "New",
    "Contacted",
    "In Discussion",
    "Meeting Scheduled",
    "Follow-Up Required",
    "Qualified",
    "Unqualified",
    "Converted",
  ];

  const ratingOptions = ["Cold", "Hot", "Warm"];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "leadSource") {
      if (value === "add_new") {
        setShowAddSourceModal(true);
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddNewSource = async () => {
    if (!newSourceName.trim()) return;

    setIsAddingSource(true);

    try {
      const config = {
        app_name: "lead-management-system",
        form_name: "Sources",
        payload: {
          data: {
            Source_Name: newSourceName,
          },
        },
      };

      const response = await ZOHO.CREATOR.DATA.addRecords(config);
      if (response.code === 3000) {
        await fetchSource();
        setShowAddSourceModal(false);
        setNewSourceName("");
        setFormData((prev) => ({
          ...prev,
          leadSource: response.data.ID,
        }));
      } else {
        setFieldErrors({
          leadSource: response.message || "Failed to add new source",
        });
      }
    } catch (error) {
      console.error("Error adding new source:", error);
      setFieldErrors({
        leadSource: error.message || "Failed to add new source",
      });
    } finally {
      setIsAddingSource(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Required fields validation
    if (!formData.leadName.trim()) {
      errors.leadName = "Lead Name is required";
      isValid = false;
    }

    if (!formData.leadSource) {
      errors.leadSource = "Lead Source is required";
      isValid = false;
    }

    if (!formData.jobTitle.trim()) {
      errors.jobTitle = "Job Title is required";
      isValid = false;
    }

    if (!formData.selectProfile) {
      errors.selectProfile = "Profile is required";
      isValid = false;
    }

    if (!formData.jobStack) {
      errors.jobStack = "Stack is required";
      isValid = false;
    }

    // Conditional validation
    const selectedSource = sources.find(
      (source) => source.ID === formData.leadSource
    );
    if (
      selectedSource?.Source_Name?.toLowerCase() === "email" &&
      !formData.email
    ) {
      errors.email = "Email is required when lead source is Email";
      isValid = false;
    }

    if (
      selectedSource?.Source_Name?.toLowerCase() === "upwork" &&
      !formData.noOfConnects
    ) {
      errors.noOfConnects =
        "Number of connects is required when lead source is Upwork";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

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

  const uploadAttachments = async (leadId) => {
    if (!selectedFiles.length) return;

    setIsUploadingFiles(true);

    try {
      for (const file of selectedFiles) {
        // Create the attachment record
        const recordPayload = {
          data: {
            Record_Id: leadId,
            Users: userId,
            Module_Mapping: "Leads",
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
      toast.error("Failed to upload some attachments");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // First update the lead
      const payloadData = {
        Name: formData.leadName || "",
        Email: formData.email || "",
        Phone_Number: formData.phone || "",
        Company: formData.company || "",
        Lead_Status: formData.leadStatus || "",
        Lead_Source: formData.leadSource || "",
        Rating: formData.rating || "",
        Industry: formData.industry || "",
        Website: { value: "", url: formData.website || "" },
        Job_Description: formData.jobDescription || "",
        Job_Title: formData.jobTitle || "",
        No_of_Connects: formData.noOfConnects || "",
        Job_Link: { value: "", url: formData.jobLink || "" },
        Profile: formData.selectProfile || "",
        Stack: formData.jobStack || "",
        Lead_Owner: userId,
      };

      const config = {
        app_name: "lead-management-system",
        report_name: "All_Leads_Dev",
        id: lead.ID,
        payload: {
          data: payloadData,
        },
      };

      const response = await ZOHO.CREATOR.DATA.updateRecordById(config);

      if (response.code === 3000) {
        // Upload new attachments if any
        if (selectedFiles.length > 0) {
          await uploadAttachments(lead.ID);
        }

        const updatedLead = {
          ...lead,
          ...payloadData,
          // Include related record display values
          Lead_Source:
            sources.find((s) => s.ID === formData.leadSource) ||
            lead.Lead_Source,
          Profile:
            profile.find((p) => p.ID === formData.selectProfile) ||
            lead.Profile,
          Stack: job.find((j) => j.ID === formData.jobStack) || lead.Stack,
          Industry:
            industry.find((i) => i.ID === formData.industry) || lead.Industry,
        };

        // Call the success handler
        if (onUpdateSuccess) {
          onUpdateSuccess(updatedLead);
        }

        toast.success("Lead updated successfully!");
        onClose();
      } else {
        throw new Error(response.message || "Failed to update lead");
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error(`Error: ${error.message || "Failed to update lead"}`);
      setFieldErrors({ form: error.message || "Failed to update lead" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSource = sources.find(
    (source) => source.ID === formData.leadSource
  );
  const isEmailSource = selectedSource?.Source_Name?.toLowerCase() === "email";
  const isUpworkSource =
    selectedSource?.Source_Name?.toLowerCase() === "upwork";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-gray-100 border border-gray-300 rounded-lg shadow-lg w-full max-w-4xl p-4 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-[#f29d29]">Edit Lead</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-xl"
          >
            &times;
          </button>
        </div>

        {fieldErrors.form && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            Error: {fieldErrors.form}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {/* Lead Name (Required) */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Lead Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="leadName"
              value={formData.leadName}
              onChange={handleChange}
              className={`w-full text-sm p-1 rounded border ${
                fieldErrors.leadName
                  ? "border-red-500"
                  : "hover:border-[#f29d29] focus:outline focus:outline-[#f29d29]"
              } bg-white`}
              required
            />
            {fieldErrors.leadName && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.leadName}
              </p>
            )}
          </div>

          {/* Email (Conditional Required) */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email {isEmailSource && <span className="text-red-500">*</span>}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full text-sm p-1 rounded border ${
                fieldErrors.email
                  ? "border-red-500"
                  : "hover:border-[#f29d29] focus:outline focus:outline-[#f29d29]"
              } bg-white`}
              required={isEmailSource}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>
          {/* Phone */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          {/* Company */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          {/* Lead Status */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Lead Status
            </label>
            <select
              name="leadStatus"
              value={formData.leadStatus}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            >
              {leadStatusOptions.map((status) => (
                <option
                  key={status}
                  value={status}
                  className="checked:bg-[#f29d29] hover:bg-[#f29d29]"
                >
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Lead Source (Required) */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Lead Source <span className="text-red-500">*</span>
            </label>
            <select
              name="leadSource"
              value={formData.leadSource}
              onChange={handleChange}
              className={`w-full text-sm p-1 rounded border ${
                fieldErrors.leadSource
                  ? "border-red-500"
                  : "hover:border-[#f29d29] focus:outline focus:outline-[#f29d29]"
              } bg-white`}
              required
            >
              <option value="">Select a source</option>
              {sources.map((source, index) => (
                <option key={index} value={source.ID}>
                  {source.Source_Name}
                </option>
              ))}
              <option value="add_new" className="text-[#f29d29] font-semibold">
                + Add New Lead Source
              </option>
            </select>
            {fieldErrors.leadSource && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.leadSource}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Rating
            </label>
            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            >
              {ratingOptions.map((rating) => (
                <option
                  key={rating}
                  value={rating}
                  className="checked:bg-[#f29d29] hover:bg-[#f29d29]"
                >
                  {rating}
                </option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div className="bg-gray-50 p-2 rounded md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Industry
            </label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            >
              <option value="">None</option>
              {industry.map((industry, index) => (
                <option key={index} value={industry.ID}>
                  {industry.Industry_Name}
                </option>
              ))}
            </select>
          </div>

          {/* Website */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          {/* Job Title (Required) */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              className={`w-full text-sm p-1 rounded border ${
                fieldErrors.jobTitle
                  ? "border-red-500"
                  : "hover:border-[#f29d29] focus:outline focus:outline-[#f29d29]"
              } bg-white`}
              required
            />
            {fieldErrors.jobTitle && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.jobTitle}
              </p>
            )}
          </div>

          {/* No of Connects (Conditional Required) */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              No of Connects{" "}
              {isUpworkSource && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              name="noOfConnects"
              value={formData.noOfConnects}
              onChange={handleChange}
              className={`w-full text-sm p-1 rounded border ${
                fieldErrors.noOfConnects
                  ? "border-red-500"
                  : "hover:border-[#f29d29] focus:outline focus:outline-[#f29d29]"
              } bg-white`}
              required={isUpworkSource}
            />
            {fieldErrors.noOfConnects && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.noOfConnects}
              </p>
            )}
          </div>

          {/* Job Link */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Job Link
            </label>
            <input
              type="text"
              name="jobLink"
              value={formData.jobLink}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          {/* Select Profile (Required) */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Profile <span className="text-red-500">*</span>
            </label>
            <select
              name="selectProfile"
              value={formData.selectProfile}
              onChange={handleChange}
              className={`w-full text-sm p-1 rounded border ${
                fieldErrors.selectProfile
                  ? "border-red-500"
                  : "hover:border-[#f29d29] focus:outline focus:outline-[#f29d29]"
              } bg-white`}
              required
            >
              <option value="">Select a profile</option>
              {profile.map((profile, index) => (
                <option key={index} value={profile.ID}>
                  {profile.Profile_Name}
                </option>
              ))}
            </select>
            {fieldErrors.selectProfile && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.selectProfile}
              </p>
            )}
          </div>

          {/* Job Stack (Required) */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Job Stack <span className="text-red-500">*</span>
            </label>
            <select
              name="jobStack"
              value={formData.jobStack}
              onChange={handleChange}
              className={`w-full text-sm p-1 rounded border ${
                fieldErrors.jobStack
                  ? "border-red-500"
                  : "hover:border-[#f29d29] focus:outline focus:outline-[#f29d29]"
              } bg-white`}
              required
            >
              <option value="">Select a stack</option>
              {job.map((job, index) => (
                <option key={index} value={job.ID}>
                  {job.Job_Stack}
                </option>
              ))}
            </select>
            {fieldErrors.jobStack && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.jobStack}
              </p>
            )}
          </div>

          {/* Job Description */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Job Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              rows="6"
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
              required
            />
          </div>

          {/* File Upload Section */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Add Attachments
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

          {/* Submit Button */}
          <div className="md:col-span-2 flex justify-end mt-2">
            <button
              type="submit"
              className="bg-[#f29d29] hover:bg-[#e08e22] text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50"
              disabled={isSubmitting || isUploadingFiles}
            >
              {isSubmitting || isUploadingFiles ? "Updating..." : "Update Lead"}
            </button>
          </div>
        </form>
      </div>

      {/* Add New Source Modal */}
      {showAddSourceModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-4 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Lead Source</h3>
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                &times;
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Name
              </label>
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter source name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="px-4 py-2 border rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewSource}
                className="px-4 py-2 bg-[#f29d29] text-white rounded text-sm hover:bg-[#e08e22]"
                disabled={isAddingSource}
              >
                {isAddingSource ? "Adding..." : "Add Source"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditLeadForm;
