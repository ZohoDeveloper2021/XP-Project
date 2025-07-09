/* global ZOHO */
import { useState } from 'react';
import Swal from 'sweetalert2'

const ConvertLeadButton = ({ lead, onConversionComplete, className = '', userId, onContactCreated, setActiveTab }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState({
    title: '',
    message: '',
    type: 'info' // 'info' | 'success' | 'error'
  });
  const [showFilters, setShowFilters] = useState(false);
  console.log(lead)

  const showMessage = (title, message, type = 'info') => {
    setPopupContent({ title, message, type });
    setShowPopup(true);
  };

const refreshLeadFromServer = async () => {
  try {
    const response = await ZOHO.CREATOR.DATA.getRecords({
      app_name: "lead-management-system",
      report_name: "All_Leads_Dev",
      criteria: `(ID == ${lead.ID})`,
    });
    if (response.code === 3000 && response.data.length > 0) {
      return response.data[0];
    }
  } catch (err) {
    console.error("Failed to refresh lead data", err);
  }
  return null;
};

const handleConvertLead = async () => {
  setIsConverting(true);

  const latestLead = await refreshLeadFromServer();
  if (!latestLead) {
    showMessage('Error', 'Failed to fetch latest lead data', 'error');
    setIsConverting(false);
    return;
  }

  let errors = [];

  if (latestLead.Lead_Status?.toLowerCase() !== "qualified") {
    errors.push('Lead status must be "Qualified" to Convert Lead');
  }

  if (String(latestLead.Remarks_Done).toLowerCase() !== "true") {
    errors.push('Meeting Remarks Required');
  }

  if (errors.length > 0) {
    Swal.fire({
      title: 'Conversion Failed',
      html: errors.join('<br>'),
      icon: 'error',
      confirmButtonText: 'OK',
      customClass: {
        confirmButton: 'bg-[#f29d29] text-white font-semibold px-4 py-2 rounded hover:bg-[#e88e10]',
        closeButton: 'text-[#f29d29] text-xl',
        popup: 'w-[450px] text-sm rounded-lg p-4'
      },
      buttonsStyling: false
    });
    setIsConverting(false);
    return;
  }

  let accountId = null;
  let createdContact = null;

  try {
    // Step 1: Create Account (only if Company is present)
    if (latestLead.Company) {
      const accountObject = {
        "Account_Name": latestLead.Company,
        "Rating": latestLead.Rating || 'N/A',
        "Phone_Number": latestLead.Phone_Number || '',
        "Website": { value: '', url: latestLead.Website?.url || latestLead.Website?.value || 'N/A' },
        "Industry": latestLead.Industry?.ID || '',
        "Account_Source": latestLead.Lead_Source?.ID,
        "Account_Owner": userId
      };

      const accountResponse = await ZOHO.CREATOR.DATA.addRecords({
        app_name: "lead-management-system",
        form_name: "Accounts",
        payload: { data: accountObject }
      });

      if (accountResponse.code !== 3000) {
        showMessage('Operation Failed', 'Failed to create account', 'error');
        return;
      }

      accountId = accountResponse.data.ID;
    }

    // Step 2: Create Contact
    const contactObject = {
      "Name": getLeadName(latestLead) || 'N/A',
      "Email": latestLead.Email || latestLead.email || '',
      "Phone_Number": latestLead.Phone_Number || '',
      "Account_Name": accountId,
      "Industry": latestLead.Industry?.ID || 'N/A',
      "Contact_Source": latestLead.Lead_Source?.ID,
      "Contact_Owner": userId,
      "Billing_Address": latestLead.Billing_Address || {},
      "Profile": latestLead.Profile.ID
    };
    console.log('Contact Object:', contactObject);

    const contactResponse = await ZOHO.CREATOR.DATA.addRecords({
      app_name: "lead-management-system",
      form_name: "Contacts",
      payload: { data: contactObject }
    });

    if (contactResponse.code !== 3000) {
      showMessage('Operation Failed', 'Failed to create contact', 'error');
      return;
    }

    const contactId = contactResponse.data.ID;
    createdContact = { ID: contactId, ...contactObject };
    localStorage.setItem('selectedContactId', contactId);
    if (setActiveTab) setActiveTab('Contacts');

    // Step 3: Create Deal
    const dealObject = {
      "Opportunity_Name": latestLead.Job_Title || 'N/A',
      "Contacts": contactId,
      "Accounts": accountId,
      "No_of_Connects": latestLead.No_of_Connects || 0,
      "Job_Link": { value: '', url: latestLead.Job_Link?.url || latestLead.Job_Link?.value || '' },
      "Stack": latestLead.Stack?.ID || 'N/A',
      "Industry": latestLead.Industry?.ID || 'N/A',
      "Is_Converted": true,
      "Job_Description": latestLead.Job_Description,
      "Opportunity_Owner": userId,
      "Select_Profile": latestLead.Profile.ID,
      "Sources": latestLead.Lead_Source?.ID
    };

    const dealResponse = await ZOHO.CREATOR.DATA.addRecords({
      app_name: "lead-management-system",
      form_name: "Opportunities",
      payload: { data: dealObject }
    });

    if (dealResponse.code !== 3000) {
      showMessage('Operation Failed', 'Failed to create deal', 'error');
      return;
    }

    const dealId = dealResponse.data.ID;

    // ====== Handle Related Records (Attachments, Notes, Reminders, Meetings) ======
    const relatedModules = [
      { report: "All_Attachments_Dev", field: "Module_Mapping", value: "Contacts" },
      { report: "All_Notes_Dev", field: "Module_Mapping", value: "Contacts" },
      { report: "All_Reminders_Dev", field: "Module", value: "Contacts" },
      { report: "All_Meetings_Dev", field: "Module", value: "Contacts" }
    ];

    for (const { report, field, value } of relatedModules) {
      try {
        const res = await ZOHO.CREATOR.DATA.getRecords({
          app_name: "lead-management-system",
          report_name: report,
          criteria: `(Record_Id == "${latestLead.ID}")`
        });

        if (res.code === 3000 && res.data.length > 0) {
          const updates = res.data.map(async (item) => {
            const payload = {
              "Is_Converted": true,
              ...(accountId && { "Accounts": accountId }),
              ...(dealId && { "Opportunities": dealId }),
              ...(contactId && { "Record_Id": contactId }),
              [field]: value
            };

            await ZOHO.CREATOR.DATA.updateRecordById({
              app_name: "lead-management-system",
              report_name: report,
              id: item.ID,
              payload: { data: payload }
            });
          });

          await Promise.all(updates);
        }
      } catch (err) {
        console.error(`Error updating ${report} - skipping:`, err);
      }
    }

    // Step 5: Delete Original Lead
    try {
      const deleteResponse = await ZOHO.CREATOR.DATA.deleteRecordById({
        app_name: "lead-management-system",
        report_name: "All_Leads_Dev",
        id: latestLead.ID
      });

      if (deleteResponse.code !== 3000) {
        showMessage('Partial Success', 'Lead converted but original record could not be deleted', 'info');
      } else {
        showMessage('Success', 'Lead successfully converted to Account, Contact, and Deal!', 'success');
      }
    } catch (deleteError) {
      console.error('Error deleting lead:', deleteError);
      showMessage('Partial Success', 'Lead converted but original record could not be deleted', 'info');
    }

    if (onContactCreated) {
      onContactCreated(createdContact);
    }

  } catch (err) {
    console.error('Conversion error:', err);
    showMessage('Error', `An unexpected error occurred: ${err.message}`, 'error');
  } finally {
    setIsConverting(false);
  }
};


  const handlePopupClose = () => {
    setShowPopup(false);
    // Only trigger completion if it was a success
    if (popupContent.type === 'success' && onConversionComplete) {
      onConversionComplete();
    }
  };

  const getLeadName = (lead) => {
    if (!lead) return 'Unknown';
    if (lead.Name) {
      if (typeof lead.Name === 'string') return lead.Name;
      if (lead.Name.first_name || lead.Name.last_name) {
        return `${lead.Name.first_name || ''} ${lead.Name.last_name || ''}`.trim();
      }
      return lead.Name.zc_display_value || 'Unknown';
    }
    return lead.name || 'Unknown';
  };

  const getPopupColor = () => {
    switch (popupContent.type) {
      case 'success': return 'bg-green-100 border-green-400 text-green-700';
      case 'error': return 'bg-red-100 border-red-400 text-red-700';
      default: return 'bg-blue-100 border-blue-400 text-blue-700';
    }
  };

  const getButtonColor = () => {
    switch (popupContent.type) {
      case 'success': return 'bg-green-500 hover:bg-green-600';
      case 'error': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleConvertLead}
        disabled={isConverting}
        className={`px-4 py-2 rounded-md text-white ${isConverting ? 'bg-gray-400' : 'bg-[#f29d29] hover:bg-[#e08c1a]'} ${className}`}
      >
        {isConverting ? 'Converting...' : 'Convert Lead'}
      </button>

      {/* Unified Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`border-l-4 p-4 rounded-lg max-w-md w-full bg-white shadow-lg ${getPopupColor()}`}>
            <div className="flex items-start">
              <h3 className="text-lg font-semibold mb-2">{popupContent.title}</h3>
            </div>
            <p className="mb-4">{popupContent.message}</p>

            <div className="flex justify-end">
              <button
                onClick={handlePopupClose}
                className={`px-4 py-2 text-white rounded-md ${getButtonColor()}`}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvertLeadButton;