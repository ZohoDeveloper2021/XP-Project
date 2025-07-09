/* global ZOHO */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AddAccount = ({ onClose, onAccountAdded, currentUser, permissions }) => {
  const [formData, setFormData] = useState({
    accountName: '',
    rating: '',
    website: '',
    billingAddressLine1: '',
    billingAddressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    employees: '',
    industry: '',
    accountOwner: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState("");
  const [sources, setSources] = useState([]);
  const [industry, setIndustry] = useState([]);
  // Attachment related states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const [contact, setContact] = useState([]);
 const isTeamLead = permissions?.includes("Team Lead");
  const ratingOptions = ['Hot', 'Warm', 'Cold'];

  const fetchUser = async () => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Users_Dev",
        criteria: `(Email == "${currentUser}")`,
      });
      
      if (response.data && response.data.length > 0) {
        setUserId(response.data[0].ID);
      } else {
        setError('Could not fetch current employee');
      }
    } catch (err) {
      console.error('Error fetching employee:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUser();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
  useEffect(() => {
    fetchContact();
  }, []);

  let config = {
    app_name: "lead-management-system",
    report_name: "All_Sources_Dev",
    max_records: 1000
  };

  async function fetchSource() {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords(config);
      const records = response.data || []
      setSources(records);
    } catch (error) {
      console.error('Error fetching data from Zoho:', error);
      throw error; 
    }
  }

  let industryConfig = {
    app_name: "lead-management-system",
    report_name: "All_Industries_Dev",
    max_records: 1000
  };

  async function fetchIndustry() {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords(industryConfig);
      const records = response.data || []
      setIndustry(records);
    } catch (error) {
      console.error('Error fetching Job Stack data from Zoho:', error);
      throw error; 
    }
  }

  useEffect(() => {
    fetchSource();
    fetchIndustry();
  }, []);

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

  const uploadAttachments = async (accountId) => {
    if (!selectedFiles.length) return;
    
    setIsUploadingFiles(true);
    
    try {
      for (const file of selectedFiles) {
        // Create the attachment record
        const recordPayload = {
          data: {
            Record_Id: accountId,
            Users: userId || null,
            Module_Mapping: 'Accounts'
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
      toast.error('Failed to upload some attachments');
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const accountData = {
        Account_Name: formData.accountName,
        Rating: formData.rating,
        Website: {value: '', url: formData.website},
        Billing_Address:{
          address_line_1: formData.billingAddressLine1,
          address_line_2: formData.billingAddressLine2,
          state_province: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
          district_city: formData.city,
        },
        Employees: formData.employees,
        Industry: formData.industry,
        Account_Owner: userId,
        Account_Source: formData.accountSource,
        Contacts_Map: formData.contactSource,
      };

      const response = await ZOHO.CREATOR.DATA.addRecords({
        app_name: "lead-management-system",
        form_name: "Accounts",
        payload: {
          data: accountData
        }
      });

      if (response.code === 3000) {
        const accountId = response.data.ID;
        
        // Upload attachments if any
        if (selectedFiles.length > 0) {
          await uploadAttachments(accountId);
        }
        
        toast.success('Account created successfully!');
        onAccountAdded();
      } else {
        throw new Error(response.message || 'Failed to add account');
      }
    } catch (err) {
      console.error('Error adding account:', err);
      setError(err.message || 'Failed to add account. Please try again.');
      toast.error(`Error: ${err.message || 'Failed to add account'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-gray-100 border border-gray-300 rounded-lg shadow-lg w-full max-w-2xl p-4 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-[#f29d29]">Add New Account</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 text-xl">&times;</button>
        </div>
        
        {error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-50 p-2 rounded md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Account Name*</label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              required
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            >
              <option value="">- Select -</option>
              {ratingOptions.map((rating) => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://"
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Account Source</label>
            <select
              name="accountSource"
              value={formData.accountSource}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            >
              <option value="">Select a Source</option>
              {sources.map((source, index) => (
                <option key={index} value={source.ID}>
                  {source.Source_Name}
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
          
          <div className="bg-gray-50 p-2 rounded md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Billing Address</label>
            <input
              type="text"
              name="billingAddressLine1"
              value={formData.billingAddressLine1}
              onChange={handleChange}
              placeholder="Address Line 1"
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white mb-2"
            />
            <input
              type="text"
              name="billingAddressLine2"
              value={formData.billingAddressLine2}
              onChange={handleChange}
              placeholder="Address Line 2"
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">City / District</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">State / Province</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
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
          
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Employees</label>
            <input
              type="number"
              name="employees"
              value={formData.employees}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            />
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
            >
              <option value="">None</option>
              {industry.map((industy, index) => (
                <option key={index} value={industy.ID}>
                  {industy.Industry_Name}
                </option>
              ))}
            </select>
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
      
          <div className="md:col-span-2 flex justify-end space-x-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingFiles}
              className="px-4 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-[#f29d29] hover:bg-[#e08e22] disabled:opacity-50"
            >
              {isSubmitting || isUploadingFiles ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccount;