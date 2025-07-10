/* global ZOHO */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const EditAccountForm = ({ account, onClose, onUpdateSuccess }) => {
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
    accountSource: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [sources, setSources] = useState([]);
  const [industry, setIndustry] = useState([]);
  // Attachment related states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState([]);

  const ratingOptions = ['Hot', 'Warm', 'Cold'];

  useEffect(() => {
    if (account) {
      setFormData({
        accountName: account.Account_Name || '',
        rating: account.Rating || '',
        website: account.Website?.url || '',
        billingAddressLine1: account.Billing_Address?.address_line_1 || '',
        billingAddressLine2: account.Billing_Address?.address_line_2 || '',
        city: account.Billing_Address?.district_city || '',
        state: account.Billing_Address?.state_province || '',
        postalCode: account.Billing_Address?.postal_code || '',
        country: account.Billing_Address?.country || '',
        employees: account.Employees || '',
        industry: account.Industry?.ID || '',
        accountSource: account.Account_Source?.ID || ''
      });
      
      // Fetch existing attachments
      fetchAttachments(account.ID);
    }
    fetchSource();
    fetchIndustry();
  }, [account]);

  const fetchAttachments = async (accountId) => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: 'lead-management-system',
        report_name: 'All_Attachments_Dev',
        criteria: `(Record_Id == "${accountId}" && Module_Mapping == "Accounts")`
      });
      setExistingAttachments(response.data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const fetchSource = async () => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: 'lead-management-system',
        report_name: 'All_Sources_Dev',
        max_records: 1000
      });
      setSources(response.data || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const fetchIndustry = async () => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Industries_Dev",
        max_records: 1000
      });
      setIndustry(response.data || []);
    } catch (error) {
      console.error('Error fetching industries:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleRemoveExistingAttachment = async (attachmentId) => {
    try {
      await ZOHO.CREATOR.DATA.deleteRecordById({
        app_name: 'lead-management-system',
        report_name: 'All_Attachments_Dev',
        id: attachmentId
      });
      setExistingAttachments(prev => prev.filter(a => a.ID !== attachmentId));
      toast.success('Attachment removed successfully');
    } catch (error) {
      console.error('Error removing attachment:', error);
      toast.error('Failed to remove attachment');
    }
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
      // Refresh attachments list
      await fetchAttachments(accountId);
    } catch (error) {
      console.error('Error uploading attachments:', error);
      toast.error('Failed to upload some attachments');
    } finally {
      setIsUploadingFiles(false);
      setSelectedFiles([]);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!account || !account.ID) return;

  //   setIsSubmitting(true);
  //   setSubmitError(null);

  //   try {
  //     const config = {
  //       app_name: 'lead-management-system',
  //       report_name: 'All_Accounts_Dev',
  //       id: account.ID,
  //       payload: {
  //         data: {
  //           Account_Name: formData.accountName || '',
  //           Rating: formData.rating || '',
  //           Website: { value: '', url: formData.website || '' },
  //           Billing_Address: {
  //             address_line_1: formData.billingAddressLine1 || '',
  //             address_line_2: formData.billingAddressLine2 || '',
  //             district_city: formData.city || '',
  //             state_province: formData.state || '',
  //             postal_code: formData.postalCode || '',
  //             country: formData.country || ''
  //           },
  //           Employees: formData.employees || '',
  //           Industry: formData.industry || '',
  //           Account_Source: formData.accountSource || ''
  //         }
  //       }
  //     };

  //     const response = await ZOHO.CREATOR.DATA.updateRecordById(config);
      
  //     if (response.code === 3000) {
  //       // Upload new attachments if any
  //       if (selectedFiles.length > 0) {
  //         await uploadAttachments(account.ID);
  //       }
        
  //       toast.success('Account updated successfully');
  //       if (onUpdateSuccess) onUpdateSuccess();
  //       onClose();
  //     } else {
  //       throw new Error(response.message || 'Failed to update account');
  //     }
  //   } catch (err) {
  //     console.error('Error updating account:', err);
  //     setSubmitError(err.message || 'Failed to update account. Please try again.');
  //     toast.error(`Error: ${err.message || 'Failed to update account'}`);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!account || !account.ID) return;

  setIsSubmitting(true);
  setSubmitError(null);

  try {
    // Prepare the update payload
    const updatePayload = {
      app_name: 'lead-management-system',
      report_name: 'All_Accounts_Dev',
      id: account.ID,
      payload: {
        data: {
          Account_Name: formData.accountName || '',
          Rating: formData.rating || '',
          Website: { value: '', url: formData.website || '' },
          Billing_Address: {
            address_line_1: formData.billingAddressLine1 || '',
            address_line_2: formData.billingAddressLine2 || '',
            district_city: formData.city || '',
            state_province: formData.state || '',
            postal_code: formData.postalCode || '',
            country: formData.country || ''
          },
          Employees: formData.employees || '',
          Industry: formData.industry || '',
          Account_Source: formData.accountSource || ''
        }
      }
    };

    // 1. First update the account record
    const updateResponse = await ZOHO.CREATOR.DATA.updateRecordById(updatePayload);
    
    if (updateResponse.code !== 3000) {
      throw new Error(updateResponse.message || 'Failed to update account');
    }

    // 2. Upload new attachments if any
    if (selectedFiles.length > 0) {
      await uploadAttachments(account.ID);
    }

    // 3. Get the fully updated record with all relationships
    const fetchConfig = {
      app_name: 'lead-management-system',
      report_name: 'All_Accounts_Dev',
      id: account.ID,
      criteria: `ID == "${account.ID}"`,
      // Add these parameters to ensure consistent data structure
      parameters: {
        raw: 'true',
        isbulk: 'false'
      }
    };

    const fetchResponse = await ZOHO.CREATOR.DATA.getRecordById(fetchConfig);
    
    if (fetchResponse.code === 3000) {
      const updatedAccount = fetchResponse.data;
      
      // Format the data to match exactly what AccountDetailsPage expects
      const formattedAccount = {
        ...updatedAccount,
        // Ensure consistent structure for all fields
        Account_Name: updatedAccount.Account_Name || '',
        Rating: updatedAccount.Rating || '',
        Website: updatedAccount.Website || { url: '', value: '' },
        Billing_Address: updatedAccount.Billing_Address || {
          address_line_1: '',
          address_line_2: '',
          district_city: '',
          state_province: '',
          postal_code: '',
          country: ''
        },
        Employees: updatedAccount.Employees || '',
        // Handle both string ID and object formats
        Industry: typeof updatedAccount.Industry === 'string' ? 
          { 
            ID: updatedAccount.Industry,
            zc_display_value: industry.find(i => i.ID === updatedAccount.Industry)?.Industry_Name || ''
          } : 
          {
            ...updatedAccount.Industry,
            zc_display_value: updatedAccount.Industry?.Industry_Name || ''
          },
        Account_Source: typeof updatedAccount.Account_Source === 'string' ? 
          { 
            ID: updatedAccount.Account_Source,
            zc_display_value: sources.find(s => s.ID === updatedAccount.Account_Source)?.Source_Name || ''
          } : 
          {
            ...updatedAccount.Account_Source,
            zc_display_value: updatedAccount.Account_Source?.Source_Name || ''
          }
      };

      // 4. Call the success handler with the properly formatted data
      if (onUpdateSuccess) {
        onUpdateSuccess(formattedAccount);
      }

      toast.success('Account updated successfully');
      onClose();
    } else {
      throw new Error("Failed to fetch updated account data");
    }
  } catch (err) {
    console.error('Error updating account:', err);
    setSubmitError(err.message || 'Failed to update account. Please try again.');
    toast.error(`Error: ${err.message || 'Failed to update account'}`);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-gray-100 border border-gray-300 rounded-lg shadow-lg w-full max-w-4xl p-4 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-[#f29d29]">Edit Account</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 text-xl">×</button>
        </div>

        {submitError && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            Error: {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Row 1 */}
          <div className="bg-gray-50 p-2 rounded md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Account Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              className="w-full text-sm p-1 rounded border hover:border-[#f29d29] focus:outline focus:outline-[#f29d29] bg-white"
              required
            />
          </div>

          {/* Row 2 */}
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

          {/* Row 3 */}
          <div className="bg-gray-50 p-2 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-1">Account Source</label>
            <select
              name="accountSource"
              value={formData.accountSource}
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

          {/* Row 4 */}
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

          {/* Row 5 - Address */}
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

          {/* Row 6 */}
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

          {/* Row 7 */}
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

          {/* Existing Attachments */}
          {/* {existingAttachments.length > 0 && (
            <div className="bg-gray-50 p-2 rounded md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Existing Attachments</label>
              <div className="space-y-2">
                {existingAttachments.map((attachment) => (
                  <div key={attachment.ID} className="flex items-center justify-between p-2 border rounded bg-white">
                    <div className="flex items-center space-x-2">
                      {isImageFile(attachment.File_Name) ? (
                        <div className="w-8 h-8 rounded overflow-hidden bg-gray-100">
                          <img 
                            src={`https://creator.zoho.com${attachment.File_upload?.url}`} 
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
                      <span className="text-sm truncate max-w-xs">{attachment.File_Name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingAttachment(attachment.ID)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* New Attachments */}
          <div className="bg-gray-50 p-2 rounded md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Add New Attachments</label>
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
              type="button"
              onClick={onClose}
              className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1.5 rounded text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#f29d29] hover:bg-[#e08e22] text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50"
              disabled={isSubmitting || isUploadingFiles}
            >
              {isSubmitting || isUploadingFiles ? 'Updating...' : 'Update Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountForm;