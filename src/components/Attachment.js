/* global ZOHO */
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';

const Attachments = ({ module, RecordId, currentUser }) => {
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
  const [hasFetchedAttachments, setHasFetchedAttachments] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [isItemLoading, setIsItemLoading] = useState(false);

  // Helper function to determine if file is an image
  const isImageFile = (filename) => {
    if (!filename) return false;
    const extension = filename.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'heic', 'webp'];
    return imageExtensions.includes(extension);
  };

  // Fetch current employee
  const fetchCurrentEmployee = async () => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Users_Dev",
        criteria: `(Email == "${currentUser}")`,
      });
      
      if (response.data && response.data.length > 0) {
        console.log(response.data);
        setCurrentEmployeeId(response.data[0].ID);
      } else {
        setError('Could not fetch current employee');
      }
    } catch (err) {
      console.error('Error fetching employee:', err);
      setError('Error fetching employee: ' + err.message);
    }
  };

  // Fetch attachments
  const fetchAttachmentList = async () => {
    setIsAttachmentsLoading(true);
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Attachments_Dev",
        criteria: `(Record_Id == "${RecordId}" || Accounts == "${RecordId}" || Opportunities == "${RecordId}")`,
      });
      
      if (response.data) {
        console.log(response.data);
        setAttachments(response.data);
        setHasFetchedAttachments(true);
      } else {
        setError('Could not fetch attachments');
      }
    } catch (err) {
      console.error('Error fetching attachments:', err);
      setError('Error fetching attachments: ' + err.message);
    } finally {
      setIsAttachmentsLoading(false);
    }
  };

  // console.log("attachments>>>", attachments);

  // Process valid attachments
  const validAttachments = attachments.reduce((acc, attachment) => {
    const hasFileUpload = !!attachment.File_upload;
    const hasImages = !!attachment.Images;

    if (hasFileUpload) {
      acc.push({
        ...attachment,
        type: 'file',
        url: attachment.File_upload,
        key: `${attachment.ID}-file`,
        added_time: attachment.Added_Time,
        user_name: attachment["Users.Name"]
      });
    }
    if (hasImages) {
      acc.push({
        ...attachment,
        type: 'image',
        url: attachment.Images,
        key: `${attachment.ID}-image`,
        added_time: attachment.Added_Time,
        user_name: attachment["Users.Name"]
      });
    }
    return acc;
  }, []);
console.log("validAttachments", validAttachments)
  // Get file type
  const getFileType = (url) => {
    if (!url) return 'unknown';
    
    const filepathMatch = url.match(/\?filepath=(.+)$/);
    const filepath = filepathMatch ? filepathMatch[1] : '';
    const filename = filepath.split('/').pop() || '';
    
    const extension = filename.split('.').pop().toLowerCase();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'heic', 'webp'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    
    if (imageExtensions.includes(extension)) {
      return 'image';
    } else if (documentExtensions.includes(extension)) {
      return 'document';
    } else {
      return 'file';
    }
  };

  // Get file name
  const getFileName = (url) => {
    if (!url) return 'Unknown file';
    
    const filepathMatch = url.match(/\?filepath=(.+)$/);
    const filepath = filepathMatch ? filepathMatch[1] : '';
    const filename = filepath.split('/').pop() || '';
    
    return decodeURIComponent(filename);
  };

  // Get file name with extension
  const getFileNameWithExtension = (url) => {
    if (!url) return 'Unknown file';
    
    const filepathMatch = url.match(/\?filepath=(.+)$/);
    const filepath = filepathMatch ? filepathMatch[1] : '';
    const filename = filepath.split('/').pop() || '';
    
    const cleanFilename = filename.includes('_') ? filename.split('_').slice(1).join('_') : filename;
    return decodeURIComponent(cleanFilename);
  };

  // Handle preview click
  const handlePreviewClick = (attachment, fileType) => {
    if (fileType === 'image') {
      setIsItemLoading(true);
      let previewUrl = `https://creatorexport.zoho.com/file/xpertprimellc75/lead-management-system/All_Attachments_Dev/${attachment.ID}/${attachment.type === 'image' ? 'Images' : 'File_upload'}/image-download/ODefAGWFOChr7O1uX6wbywK3JX1QdnfCFNQ9D8nxu1NpUGgB1aFUX5vHGqZG0DnEx0Uth62O9h9Pv4JXSArREnsbaARdtVyt7bsC?filepath=${attachment.url.match(/\?filepath=(.+)$/)[1]}`;
      console.log(previewUrl)
      setPreviewItem({
        type: 'image',
        url: previewUrl,
        name: getFileName(attachment.url)
      });
    } else {
      let downloadUrl;
      const filepathMatch = attachment.url.match(/\?filepath=(.+)$/);
      const filepath = filepathMatch ? filepathMatch[1] : '';
      downloadUrl = `https://creatorexport.zoho.com/file/xpertprimellc75/lead-management-system/All_Attachments_Dev/${attachment.ID}/File_upload/image-download/ODefAGWFOChr7O1uX6wbywK3JX1QdnfCFNQ9D8nxu1NpUGgB1aFUX5vHGqZG0DnEx0Uth62O9h9Pv4JXSArREnsbaARdtVyt7bsC?filepath=${filepath}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getFileName(attachment.url);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Close preview
  const closePreview = () => {
    setPreviewItem(null);
    setIsItemLoading(false);
  };

  // Handle item load
  const handleItemLoad = () => {
    setIsItemLoading(false);
  };

  // Handle file change
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Handle file upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
  
    setIsSubmitting(true);
    
    try {
      // Create the attachment record
      const recordPayload = {
        data: {
          Record_Id: RecordId,
          Users: currentEmployeeId || null,
          Module_Mapping: module
        },
      };

      const response = await ZOHO.CREATOR.DATA.addRecords({
        app_name: 'lead-management-system',
        form_name: 'Attachments',
        payload: recordPayload
      });

      if (response.code === 3000) {
        const recordId = response.data.ID;
        
        // Determine the field name based on file type
        const File_upload = isImageFile(selectedFile.name) ? 'File_upload' : 'File_upload';

        const fileUploadConfig = {
          app_name: 'lead-management-system',
          report_name: 'All_Attachments_Dev',
          id: recordId,
          field_name: File_upload,
          file: selectedFile,
        };

        // Upload the actual file
        const fileResponse = await ZOHO.CREATOR.FILE.uploadFile(fileUploadConfig);
        
        if (fileResponse.code !== 3000) {
          throw new Error(fileResponse.message || 'File upload failed');
        }

        // Reset form and refresh attachments
        setShowAddForm(false);
        setSelectedFile(null);
        if (document.getElementById('fileInput')) {
          document.getElementById('fileInput').value = '';
        }
        
        await fetchAttachmentList();
      } else {
        throw new Error(response.message || 'Record creation failed');
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      toast.error(`Error: ${error.message || 'Failed to upload attachment'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (RecordId) {
      fetchAttachmentList();
    }
    if (currentUser) {
      fetchCurrentEmployee();
    }
  }, [RecordId, currentUser]);

  if (!RecordId) {
    return (
      <div>
        <p className="text-gray-500">No attachments available for {module}.</p>
      </div>
    );
  }

  if (isAttachmentsLoading && attachments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f29d29]"></div>
      </div>
    );
  }

  return (
    <div className="">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {previewItem && previewItem.type === 'image' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-full p-2">
            <button 
              onClick={closePreview}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {isItemLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-[#f29d29]"></div>
              </div>
            )}
            
            <img 
              src={previewItem.url} 
              alt={previewItem.name} 
              className={`max-w-full max-h-[90vh] object-contain ${isItemLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={handleItemLoad}
              onError={() => {
                setIsItemLoading(false);
                setError("Failed to load image");
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-5 py-3 rounded-t-lg flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-700">Attachments for {module}</h3>
          <button
            className={`group p-1 rounded-full hover:bg-[#f29d29] hover:scale-110 bg-[#f29d29] text-white transition-all duration-500 transform ${
              showAddForm ? 'rotate-25' : 'rotate-0'
            }`}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showAddForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"}
              />
            </svg>
          </button>
        </div>

        {showAddForm && (
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File
                </label>
                <div className="flex items-center justify-center w-full">
                  {selectedFile ? (
                    <div className="w-full border-2 border-[#f29d29] bg-orange-50 rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {isImageFile(selectedFile.name) ? (
                            <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                              <img
                                src={URL.createObjectURL(selectedFile)}
                                alt="Preview"
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-6 h-6 text-[#f29d29]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                                />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {selectedFile.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                          }}
                          className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          <svg
                            className="w-5 h-5"
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
                  ) : (
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
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, DOCX, JPG, PNG up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        id="fileInput"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.svg,.heic,.webp"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#f29d29] hover:bg-[#d98222] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f29d29] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {validAttachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg className="w-16 h-16 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg">No attachments available</p>
            <p className="text-sm text-gray-400">Upload files or images to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {validAttachments.map((attachment) => {
              const fileType = getFileType(attachment.url);

              return (
                <div key={attachment.key} className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
                  <div className="p-2 bg-gradient-to-r from-orange-50 to-gray-50 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-[#f29d29] text-white rounded-full flex items-center justify-center text-xs">
                        {attachment.user_name?.charAt(0) || '?'}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-medium text-[#f29d29] text-sm truncate">
                          {attachment.user_name || 'Unknown User'}
                        </h4>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2 flex-grow">
                    <div className="relative group rounded-md overflow-hidden">
                      {fileType === 'image' ? (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <button 
                              onClick={() => handlePreviewClick(attachment, fileType)} 
                              className="bg-[#f29d29] hover:bg-[#d98222] text-white rounded-full p-2 transition-all duration-200 hover:scale-110 z-10"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-center">
                          <div className="w-full h-20 bg-gray-50 flex flex-col items-center justify-center rounded-md">
                            <svg className="w-10 h-10 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-3-3v6m-9 1V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-xs text-gray-500 truncate max-w-full px-2">
                              {getFileNameWithExtension(attachment.url)}
                            </p>
                          </div>
                          <button 
                            onClick={() => handlePreviewClick(attachment, fileType)}
                            className="mt-2 text-xs inline-flex items-center px-2.5 py-1 bg-[#f29d29] text-white rounded hover:bg-[#d98222]"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-3 py-1.5 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
                    <span>{attachment.added_time || 'No date'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attachments;