/* global ZOHO */
import { useState, useEffect } from 'react';

const AddContact = ({ onClose, onContactAdded, currentUser, userId, permissions }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    account: '',
    title: '',
    department: '',
    address_line_1: '',
    address_line_2: '',
    district_city: '',
    postal_code: '',
    state_province: '',
    description: '',
    country: '',
    contactSource: '',
    profile: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sources, setSources] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const isTeamLead = permissions?.includes('Team Lead');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchSource = async () => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Sources_Dev",
        max_records: 1000
      });
      setSources(response.data || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
      setError('Failed to load contact sources');
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Profiles_Dev",
        max_records: 1000
      });
      setProfiles(response.data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('Failed to load profiles');
    }
  };
  

  const fetchAccount = async () => {
    try {
      let config = {
        app_name: "lead-management-system",
        report_name: "All_Accounts_Dev",
        max_records: 1000
      };

      // If user is not a team lead, filter accounts by owner
      if (!isTeamLead) {
        config.criteria = `Account_Owner.Email == "${currentUser}"`;
      }

      const response = await ZOHO.CREATOR.DATA.getRecords(config);
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Failed to load accounts');
    }
  };

  const isImageFile = (filename) => {
    if (!filename) return false;
    const extension = filename.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'heic', 'webp'];
    return imageExtensions.includes(extension);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (contactId) => {
    if (!selectedFiles.length) return;
    
    setIsUploadingFiles(true);
    
    try {
      for (const file of selectedFiles) {
        // Create the attachment record
        const recordPayload = {
          data: {
            Users: userId,
            Record_Id: contactId,
            Module_Mapping: 'Contacts'
          },
        };

        const response = await ZOHO.CREATOR.DATA.addRecords({
          app_name: 'lead-management-system',
          form_name: 'Attachments',
          payload: recordPayload
        });

        if (response.code === 3000) {
          const recordId = response.data.ID;
          const fieldName = isImageFile(file.name) ? 'File_upload' : 'File_upload';

          const fileUploadConfig = {
            app_name: 'lead-management-system',
            report_name: 'All_Attachments_Dev',
            id: recordId,
            field_name: fieldName,
            file: file,
          };

          // Upload the actual file
          await ZOHO.CREATOR.FILE.uploadFile(fileUploadConfig);
        }
      }
    } catch (error) {
      console.error('Error uploading attachments:', error);
      throw error;
    } finally {
      setIsUploadingFiles(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchSource(),
          fetchAccount(),
          fetchProfiles()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    fetchData();
  }, [currentUser, isTeamLead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const contactData = {
        Name: `${formData.firstName} ${formData.lastName}`.trim(),
        Email: formData.email,
        Phone_Number2: formData.phone,
        Account_Name: formData.account,
        Title: formData.title,
        Department: formData.department,
        Billing_Address: {
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2,
          state_province: formData.state_province,
          postal_code: formData.postal_code,
          country: formData.country,
          district_city: formData.district_city,
        },
        Contact_Source: formData.contactSource,
        Contact_Owner: userId,
        Description: formData.description,
        Profile: formData.profile
      };

      const response = await ZOHO.CREATOR.DATA.addRecords({
        app_name: "lead-management-system",
        form_name: "Contacts",
        payload: {
          data: contactData
        }
      });

      if (response.code === 3000) {
        if (selectedFiles.length > 0) {
          await uploadAttachments(response.data.ID);
        }
        onContactAdded();
      } else {
        throw new Error(response.message || 'Failed to add contact');
      }
    } catch (err) {
      console.error('Error adding contact:', err);
      setError(err.message || 'Failed to add contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-gray-100 border border-gray-300 rounded-lg shadow-lg w-full max-w-4xl p-4 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-[#f29d29]">Add New Contact</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 text-xl">&times;</button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Row 1 */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          {/* Row 2 */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          {/* Row 3 - Account Lookup */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
            <select
              name="account"
              value={formData.account}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            >
              <option value="">Select an Account</option>
              {accounts.map((account) => (
                <option key={account.ID} value={account.ID}>
                  {account.Account_Name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact Source</label>
            <select
              name="contactSource"
              value={formData.contactSource}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            >
              <option value="">Select a Source</option>
              {sources.map((source) => (
                <option key={source.ID} value={source.ID}>
                  {source.Source_Name}
                </option>
              ))}
            </select>
          </div>

          {/* Row 4 */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <select
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            >
              <option value="">Select Title</option>
              <option value="CEO">CEO</option>
              <option value="VP">VP</option>
              <option value="Director">Director</option>
              <option value="Sales Manager">Sales Manager</option>
              <option value="Support Manager">Support Manager</option>
              <option value="Sales Representative">Sales Representative</option>
              <option value="Support Agent">Support Agent</option>
              <option value="Procurement Manager">Procurement Manager</option>
            </select>
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            >
              <option value="">Select Department</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Profile Dropdown */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Profile <span className="text-red-500">*</span></label>
            <select
              name="profile"
              value={formData.profile}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
              required
            >
              <option value="">Select a Profile </option>
              {profiles.map((profile) => (
                <option key={profile.ID} value={profile.ID}>
                  {profile.Profile_Name}
                </option>
              ))}
            </select>
          </div>

          {/* Address Fields */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Address line 1</label>
            <input
              type="text"
              name="address_line_1"
              value={formData.address_line_1}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Address line 2</label>
            <input
              type="text"
              name="address_line_2"
              value={formData.address_line_2}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="district_city"
              value={formData.district_city}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">State/Province</label>
            <input
              type="text"
              name="state_province"
              value={formData.state_province}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          {/* File Upload Section */}
          <div className="bg-gray-50 p-2 rounded md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Attachments
            </label>
            <div className="space-y-2">
              {selectedFiles.length > 0 ? (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded bg-white">
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
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        )}
                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                        <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-md cursor-pointer transition-colors hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">
                        <span className="font-semibold text-[#f29d29]">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOCX, JPG, PNG up to 10MB</p>
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
              disabled={isSubmitting || isUploadingFiles}
              className="bg-[#f29d29] hover:bg-[#e08e22] text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting || isUploadingFiles ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContact;