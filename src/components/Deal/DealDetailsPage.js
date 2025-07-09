/* global ZOHO */
import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Attachments from '../Attachment';
import Notes from '../Notes';
import EditDealForm from "../Deal/EditDealForm"
import Meeting from '../Meeting';
import AccountDetailsPage from '../Account/AccountDetailsPage';
import ContactDetailsPage from '../Contact/ContactDetailsPage';
import Reminder from '../Reminder';
import ProposalStageForm from './ProposalStageForm';
import StageHistory from "./StageHistory"
import toast, { Toaster } from "react-hot-toast";

// Memoized ProgressBar component to prevent re-rendering on tab change

const ProgressBar = memo(({ deal, stages, onStageChange }) => {
  const getStage = () => {
    if (!deal) return 'N/A';
    return deal.Stage || deal.stage || 'N/A';
  };
console.log(deal)
  const currentStage = getStage();
  const currentStageIndex = stages.findIndex(stage => stage === currentStage);
  
  // Calculate progress to exactly reach the current node
  const progressPercent = currentStageIndex >= 0 ? 
    (currentStageIndex / (stages.length - 1)) * 100 : 0;
  
  // Calculate positioning for nodes to fit properly
  const nodeSpacing = 150; // Width for each node section
  const totalWidth = (stages.length - 1) * nodeSpacing;

  const handleStageClick = (stage) => {
    if (onStageChange && stage !== currentStage) {
      onStageChange(stage);
    }
  };
  
  return (
    <div className="w-full px-8 py-5 bg-white border-b overflow-hidden">
      <div className="w-full relative flex ml-[140px]">
        <div className="relative" style={{ width: `${totalWidth}px`, height: '80px' }}>
          {/* Background Line - only between nodes */}
          <div 
            className="absolute top-[1.4rem] h-[0.4rem] bg-gray-300 rounded-full"
            style={{ 
              left: '14px',
              right: '14px',
              width: `${totalWidth}px`
            }}
          ></div>
          
          {/* Animated Progress Line - stops exactly at current node */}
          <motion.div 
            className="absolute top-[1.4rem] h-[0.4rem] bg-gradient-to-r from-[#f29d29] to-[#ff8c00] rounded-full shadow-sm"
            style={{ left: '10px' }}
            initial={{ width: 0 }}
            animate={{ 
              width: currentStageIndex >= 0 ? 
                `${(currentStageIndex / (stages.length - 1)) * (totalWidth)}px` : 
                '0px'
            }}
            transition={{ 
              duration: 1.5, 
              ease: "easeInOut",
              type: "spring",
              stiffness: 100,
              damping: 20
            }}
          ></motion.div>
          
          {/* Stage Circles and Labels */}
          {stages.map((stage, index) => {
            const isActive = index === currentStageIndex;
            const isPassed = index < currentStageIndex;
            const leftPosition = index * nodeSpacing;
            
            return (
              <motion.div 
                key={stage} 
                className="absolute flex flex-col items-center"
                style={{ 
                  left: `${leftPosition}px`,
                  top: '4px'
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: index * 0.1,
                  duration: 0.6,
                  ease: "easeOut"
                }}
                onClick={() => handleStageClick(stage)}
              >
                {/* Animated Circle */}
                <motion.div 
                  className={`w-10 h-10 rounded-full border-4 flex items-center justify-center font-bold text-sm relative overflow-hidden cursor-pointer ${
                    isActive || isPassed
                      ? 'border-none text-white shadow-lg' 
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Background fill animation */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-[#f29d29] to-[#ff8c00] rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: (isActive || isPassed) ? 1 : 0 
                    }}
                    transition={{ 
                      duration: 0.6,
                      ease: "easeInOut",
                      delay: isActive ? 0.3 : 0
                    }}
                  />
                  
                  {/* Content */}
                  <motion.div 
                    className="relative z-10 flex items-center justify-center w-full h-full"
                    initial={false}
                    animate={{ 
                      rotateY: isActive ? [0, 180, 360] : 0 
                    }}
                    transition={{ 
                      duration: 0.3,
                      ease: "easeInOut"
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isActive ? (
                        <motion.span
                          key="checkmark"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ duration: 0.1 }}
                          className="text-white font-bold text-lg"
                        >
                          ✓
                        </motion.span>
                      ) : (
                        <motion.span
                          key="number"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.3 }}
                          className={isPassed ? "text-white" : "text-gray-500"}
                        >
                          {index + 1}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
                
                {/* Stage Label with smooth color transition */}
                <motion.div 
                  className="mt-2 text-center" 
                  style={{ width: '50px' }}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    delay: index * 0.1 + 0.2,
                    duration: 0.3
                  }}
                >
                  <motion.span 
                    className={`text-xs font-medium leading-tight block transition-colors duration-500 ${
                      isActive ? 'text-[#f29d29] font-semibold' : 
                      isPassed ? 'text-[#f29d29]' : 'text-gray-500'
                    }`}
                    animate={{
                      color: isActive ? '#f29d29' : isPassed ? '#f29d29' : '#6b7280'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {stage}
                  </motion.span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if deal prop changes
  return prevProps.deal === nextProps.deal;
});

const DealDetailsPage = ({ deal: initialDeal , onClose, currentUser, setActiveTabMain, userId , permissions }) => {
  // Define the stages in order
  const stages = [
    'On Boarded',
    'Discovery',
    'Proposal',
    'Negotiation',
    'Close Won/Lost'
  ];
  const [deal, setDeal] = useState({
  ...initialDeal,
  pendingStage: undefined
  });
  const [activeTab, setActiveTab] = useState('Overview');
   const [showEditForm, setShowEditForm] = useState(false);
   const [showMandatoryFieldsPopup, setShowMandatoryFieldsPopup] = useState(false);
   const [stageHistory, setStageHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  //  ----------######----------------
   const [redirectToAccount, setRedirectToAccount] = useState(false);
   const [account, setAccount] = useState(null);

   const [redirectToContact, setRedirectToContact] = useState(false);
   const [contact, setContact] = useState(null);
   const [showProposalForm, setShowProposalForm] = useState(false);

  

  //  ----------######----------------
   const [mandatoryFields, setMandatoryFields] = useState({
    Hourly_Rate: '',
    Hours: '',
    Project_Start_Date: '',
    Project_Close_Date: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [proposalData, setProposalData] = useState({});

  const [showCloseDealPopup, setShowCloseDealPopup] = useState(false);
  const [closeDealData, setCloseDealData] = useState({
    status: '', // 'Won' or 'Lost'
    closeDate: '',
    lossReason: '',
    projectType: deal?.Project_Type || 'N/A'
  });

  const fetchStageHistory = async (dealId) => {
    try {
      setLoadingHistory(true);
      const config = {
        app_name: 'lead-management-system',
        report_name: 'All_Opportunity_Stage_History_Dev',
        criteria: `Opportunity_Name == ${dealId}`
      };
      
      const response = await ZOHO.CREATOR.DATA.getRecords(config);
    
      console.log(response.data)
      setStageHistory(response.data);
    } catch (error) {
      console.error('Error fetching stage history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (deal?.ID) {
      fetchStageHistory(deal.ID);
    }
  }, [deal?.ID]);

  useEffect(() => {
    setDeal(initialDeal);
  }, [initialDeal]);

  const handleAccountClick = async  () => {
    if (!deal.Accounts) return;
    
    const accountId =  deal.Accounts.ID;
    
    if (accountId) {
      localStorage.setItem('selectedAccountId', accountId);
    try {
      const config = {
        app_name: 'lead-management-system',
        report_name: 'All_Accounts_Dev',
        id: accountId,
      };

      const response = await ZOHO.CREATOR.DATA.getRecordById(config);
      if (response && response.data) {
        setAccount(response.data)
        setRedirectToAccount(true);
        if (setActiveTabMain) setActiveTabMain('Accounts');
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
    }
  }
};

  const AccountDetailItem = ({ label, value }) => {
    return (
      <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {value ? (
            <button 
              onClick={handleAccountClick}
              className="text-[#f29d29] hover:underline cursor-pointer"
            >
              {value}
            </button>
          ) : (
            'N/A'
          )}
        </dd>
      </div>
    );
  };

  if (redirectToAccount) {
    return ( 
      <AccountDetailsPage 
        account={account}
        onClose={() => setRedirectToAccount(false)}
        currentUser={currentUser}
      />
    );
  }

  const handleContactClick = async () => {
    if (!deal.Contacts) return;
    
    const contactId = deal.Contacts.ID;
    
    if (contactId) {
      localStorage.setItem('selectedContactId', contactId);
      try {
        const config = {
          app_name: 'lead-management-system',
          report_name: 'All_Contacts_Dev',
          id: contactId,
        };

        const response = await ZOHO.CREATOR.DATA.getRecordById(config);
        if (response && response.data) {
          setContact(response.data);
          setRedirectToContact(true);
          if (setActiveTabMain) setActiveTabMain('Contacts');
        }
      } catch (error) {
        console.error('Error fetching contact details:', error);
      }
    }
  };

  const ContactDetailItem = ({ label, value }) => {
    return (
      <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {value ? (
            <button 
              onClick={handleContactClick}
              className="text-[#f29d29] hover:underline cursor-pointer"
            >
              {value}
            </button>
          ) : (
            'N/A'
          )}
        </dd>
      </div>
    );
  };

  if (redirectToContact) {
    return (
      <ContactDetailsPage 
        contact={contact}
        onClose={() => {
          localStorage.removeItem('selectedContactId');
          setRedirectToContact(false);
        }}
        currentUser={currentUser}
      />
    );
  }

  if (!initialDeal) return null;
console.log(deal)
  // Helper functions to safely access deal properties
  const getDealName = () => {
    if (!deal) return 'Unknown';
    if (deal.Opportunity_Name) {
      if (typeof deal.Opportunity_Name === 'string') return deal.Opportunity_Name;
      return deal.Opportunity_Name.zc_display_value || 'Unknown';
    }
    return deal.name || 'Unknown';
  };

  const getAccountName = () => {
    if (!deal) return 'N/A';
    if (typeof deal.Accounts === 'string');
    return deal.Accounts?.zc_display_value || deal.Accounts?.Account_Name;
  };

  const getContactName = () => {
    if (!deal) return 'N/A';
    if (typeof deal.Contacts === 'string');
    return deal.Contacts?.zc_display_value || deal.Contacts?.Name;
  };

  const getOwnerName = () => {
    if (!deal) return 'N/A';
    return deal.Opportunity_Owner?.zc_display_value || 'N/A';
  };

  const getStage = () => {
    if (!deal) return 'N/A';
    return deal.Stage || deal.stage || 'N/A';
  };

  const projectCloseDate = () => {
    if (!deal) return 'N/A';
    const date = deal.Project_Close_Date;
    return date ? new Date(date).toLocaleDateString() : 'N/A';
  };
  const projectStartDate = () => {
    if (!deal) return 'N/A';
    const date = deal.Project_Start_Date;
    return date ? new Date(date).toLocaleDateString() : 'N/A';
  };
  const dealStatus = () => {
    if (!deal) return 'N/A';
    const status = deal.Deal_Status
    return status || 'N/A';
  };
  const dealLoss = () => {
    const dealLossReason = deal.Loss_Reason || deal.Deal_Loss_Reason
    return dealLossReason || 'N/A';
  };

  const getAmount = () => {
    if (!deal) return 'N/A';
    const amount = deal.Amount || deal.amount;
    return amount ? `${amount.toLocaleString()} $` : 'N/A';
  };


  const handleStageChange = async (newStage) => {
  try {
    const currentStage = getStage();
    const currentStageIndex = stages.indexOf(currentStage);
    const newStageIndex = stages.indexOf(newStage);
    
    // Check if moving to Proposal stage
    if (newStage === 'Proposal') {
      setDeal(prev => ({ ...prev, pendingStage: newStage }));
      setShowProposalForm(true);
      return;
    }

    // Check if moving to Negotiation stage
    if (newStage === 'Negotiation') {
      await handleNegotiationStageClick();
      return;
    }

    // Check if moving to Close Won/Lost stage
    if (newStage === 'Close Won/Lost') {
      setDeal(prev => ({ ...prev, pendingStage: newStage }));
      setCloseDealData({
        status: '',
        closeDate: '',
        lossReason: '',
        projectType: deal?.Project_Type || 'N/A',
        projectStartDate: deal?.Project_Start_Date || '',
        projectCloseDate: deal?.Project_Close_Date || '',
      });
      setShowCloseDealPopup(true);
      return;
    }
    
    const historyRecordId = await addGenericStageHistoryRecord(deal.ID, newStage, userId);
    
    if (historyRecordId) {
      // Prepare update payload with the correct stage ID field
      const updatePayload = {
        Stage: newStage
      };
      
      // Add the appropriate stage history ID field based on the new stage
      switch(newStage) {
        case 'On Boarded':
          updatePayload.On_Boarded_ID = historyRecordId;
          break;
        case 'Discovery':
          updatePayload.Discovery_ID = historyRecordId;
          break;
        case 'Negotiation':
          updatePayload.Negotiation_ID = historyRecordId;
          break;
        case 'Close Won/Lost':
          updatePayload.Closed_Won_Lost_ID = historyRecordId;
          break;
        default:
          break;
      }
      
      await updateStageWithPayload(newStage, updatePayload);
      toast.success(`Stage updated to ${newStage} successfully!`);
    }
  } catch (error) {
    console.error('Error updating stage:', error);
  }
};

const handleCloseDealSubmit = async () => {
  console.log("handleCloseDealSubmit triggered", { closeDealData });
  try {
    // Validate fields
    if (!closeDealData.status) {
      setValidationErrors({ status: 'Please select a status' });
      return;
    }

    if (closeDealData.status === 'Lost' && !closeDealData.lossReason) {
      setValidationErrors({ lossReason: 'Please provide a reason for losing the deal' });
      return;
    }

    setValidationErrors({});

    // Format dates to dd-MMM-yyyy
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate().toString().padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Prepare history record data with amount based on project type
    const historyRecordData = {
      Deal_Status: closeDealData.status,
      Close_Date: closeDealData.closeDate ? formatDate(closeDealData.closeDate) : '',
      Deal_Loss_Reason: closeDealData.status === 'Lost' ? closeDealData.lossReason : '',
      Project_Type: closeDealData.projectType,
      Project_Start_Date: closeDealData.projectStartDate ? formatDate(closeDealData.projectStartDate) : '',
      Project_Close_Date: closeDealData.projectCloseDate ? formatDate(closeDealData.projectCloseDate) : '',
    };

    // Add amount field based on project type
    switch (closeDealData.projectType) {
      case 'Fixed Project':
        historyRecordData.Fixed_Project_Amount = deal.Amount || 0;
        break;
      case 'Project Wise':
        historyRecordData.Project_Wise_Amount = deal.Project_Wise_Amount || 0;
        break;
      case 'Remote Job':
        historyRecordData.Salary_Amount = deal.Salary_Amount || 0;
        break;
      case 'Hourly':
        historyRecordData.Hourly_Rate = deal.Hourly_Rate || 0;
        historyRecordData.Total_Hours = deal.Total_Hours || 0;
        break;
      case 'Milestone Based':
        // If milestones exist, include the subform data
        if (deal.Milestone_Based_Project_Subform?.length > 0) {
          historyRecordData.Milestone_Based_Project_Subform = deal.Milestone_Based_Project_Subform.map(
            (milestone) => ({
              Description: milestone.Description,
              Milestone_Based_Amount: milestone.Milestone_Based_Amount,
            })
          );
        }
        break;
      default:
        break;
    }

    console.log('History Record Data:', historyRecordData);

    // Create the stage history record
    const historyRecordId = await addStageHistoryRecord(
      deal.ID,
      'Close Won/Lost',
      userId,
      historyRecordData
    );

    if (historyRecordId) {
      // Update the opportunity
      const updatePayload = {
        Stage: 'Close Won/Lost',
        Closed_Won_Lost_ID: historyRecordId,
        Status: closeDealData.status,
        Close_Date: closeDealData.closeDate ? formatDate(closeDealData.closeDate) : '',
        Deal_Loss_Reason: closeDealData.status === 'Lost' ? closeDealData.lossReason : '',
        Deal_Status: closeDealData.status,
        Project_Start_Date: closeDealData.projectStartDate
          ? formatDate(closeDealData.projectStartDate)
          : '',
        Project_Close_Date: closeDealData.projectCloseDate
          ? formatDate(closeDealData.projectCloseDate)
          : '',
      };

      if (closeDealData.status === 'Won') {
        updatePayload.Is_Converted = true;
      }

      await updateStageWithPayload('Close Won/Lost', updatePayload);

      // Close the popup
      setShowCloseDealPopup(false);
      setCloseDealData({
        status: '',
        closeDate: '',
        lossReason: '',
        projectType: 'N/A',
        projectStartDate: '',
        projectCloseDate: '',
      });
    }
  } catch (error) {
    console.error('Error closing deal:', error);
  }
};
  const updateStage = async (newStage) => {
    try {
      setDeal(prev => ({ ...prev, Stage: newStage }));
     
      const config = {
        app_name: 'lead-management-system',
        report_name: 'All_Opportunities_Dev',
        id: deal.ID,
        payload: {
          data: {
            Stage: newStage 
          }
        }
      };
      await addGenericStageHistoryRecord(deal.ID, newStage, userId);
      await ZOHO.CREATOR.DATA.updateRecordById(config);
      console.log('Stage updated successfully');
      await fetchStageHistory(deal.ID);
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const updateStageWithPayload = async (newStage, payload) => {
  try {
    // Update local state first
    setDeal(prev => ({ 
      ...prev, 
      ...payload,
      pendingStage: undefined 
    }));
     
    const config = {
      app_name: 'lead-management-system',
      report_name: 'All_Opportunities_Dev',
      id: deal.ID,
      payload: {
        data: payload
      }
    };
    
    await ZOHO.CREATOR.DATA.updateRecordById(config);
    console.log('Stage updated successfully');
    await fetchStageHistory(deal.ID);
  } catch (error) {
    console.error('Error updating stage:', error);
  }
};


const handleUpdateSuccess = (updatedData) => {
  // Update the deal state with the new data
  setDeal(prev => ({ 
    ...prev, 
    ...updatedData,
    // Ensure nested objects are properly merged if needed
    Accounts: updatedData.Accounts || prev.Accounts,
    Contacts: updatedData.Contacts || prev.Contacts
  }));
  
  // Close the edit form
  setShowEditForm(false);
  
  // Show success message
  toast.success('Deal updated successfully!');
};

// In your DealDetailsPage component
const handleProposalSubmit = async (formData) => {
  try {
    console.log("Starting proposal submission...");
    // Use the pending stage or default to 'Proposal'
    const targetStage = deal.pendingStage || 'Proposal';
    const historyRecordId = await addStageHistoryRecord(
      deal.ID,
      targetStage, // Use targetStage instead of hardcoding 'Proposal'
      userId,
      formData
    );
    console.log('History Record ID:', historyRecordId);

    if (!historyRecordId) {
      throw new Error('Failed to create stage history record');
    }

    // Update the opportunity with the history record ID
    const updateConfig = {
      app_name: 'lead-management-system',
      report_name: 'All_Opportunities_Dev',
      id: deal.ID,
      payload: {
        data: {
          ...formData,
          Stage: targetStage, // Use targetStage
          Proposal_ID: historyRecordId
        }
      }
    };

    await ZOHO.CREATOR.DATA.updateRecordById(updateConfig);

    // Update local state
    setDeal(prev => ({
      ...prev,
      ...formData,
      Stage: targetStage, // Use targetStage
      Proposal_ID: historyRecordId,
      pendingStage: undefined
    }));
    toast.success('Proposal submitted successfully!')
    setShowProposalForm(false);
    await fetchStageHistory(deal.ID);
  } catch (error) {
    console.error('Error handling proposal submission:', error);
  }
};

const addStageHistoryRecord = async (dealId, stage, userId, formData) => {
  try {
    console.log('Starting to add stage history record...', {
      dealId, stage, userId, formData
    });

    const currentDate = new Date().toISOString().split('T')[0];
    const currentDateTime = new Date().toISOString();

    // Field mapping configuration - defines how form fields map to history record fields
    const fieldMappings = {

      'Close_Date': { target: 'Closing_Date', defaultValue: currentDate },
      
      // Amount fields by project type
      'Fixed_Project_Amount': { 
        target: 'Fixed_Project_Amount', 
        condition: (data) => data.Project_Type === 'Fixed Project' 
      },
      'Project_Wise_Amount': { 
        target: 'Project_Wise_Amount', 
        condition: (data) => data.Project_Type === 'Project Wise' 
      },
      'Salary_Amount': { 
        target: 'Salary_Amount', 
        condition: (data) => data.Project_Type === 'Remote Job' 
      },
      
      // Other fields
      'Hourly_Rate': { target: 'Hourly_Rate' },
      'Remaining_Amount': { target: 'Remaining_Amount' },
      'Salary_Terms': { target: 'Salary_Terms' },
      'Total_Hours': { target: 'Total_Hours' },
      'Upfront_Percentage': { target: 'Upfront_Percentage' },
      'Project_Type': { target: 'Project_Type' },
      
      Deal_Status: { target: 'Deal_Status' }, // Adjust 'Status' to the actual API name if different
      Deal_Loss_Reason: { target: 'Deal_Loss_Reason' }, // Adjust if the API name is different
      Project_Start_Date: { target: 'Project_Start_Date' }, // Adjust if the API name is different
      Project_Close_Date: { target: 'Project_Close_Date' },

      // Subforms
      'Milestone_Based_Project_Subform': { 
        target: 'Milestone_Based_Project_Subform',
        transform: (value) => value.map(milestone => ({
          Description: milestone.Description,
          Milestone_Based_Amount: milestone.Milestone_Based_Amount
        }))
      }
    };

    // Start with required base fields
    const recordData = {
      Opportunity_Name: dealId,
      Stage_Name: stage,
      Start_Date: currentDate,
      Modified_Time: currentDateTime,
      User: userId
    };

    // Process all fields in formData
    Object.entries(formData).forEach(([field, value]) => {
      if (fieldMappings[field]) {
        const mapping = fieldMappings[field];
        
        // Check condition if specified
        if (mapping.condition && !mapping.condition(formData)) {
          return;
        }
        
        // Apply transform if specified
        const finalValue = mapping.transform ? mapping.transform(value) : value;
        
        // Only set if value exists or default is specified
        if (finalValue !== undefined && finalValue !== null) {
          recordData[mapping.target] = finalValue;
        } else if (mapping.defaultValue !== undefined) {
          recordData[mapping.target] = mapping.defaultValue;
        }
      }
    });

    const config = {
      app_name: 'lead-management-system',
      form_name: 'Opportunity_Stage_History',
      payload: {
        data: recordData
      }
    };

    console.log('Sending stage history data:', config);

    const response = await ZOHO.CREATOR.DATA.addRecords(config);

    if (!response || !response.data.ID) {
      console.error('Invalid response from Zoho Creator:', response);
      throw new Error('Failed to get record ID from response');
    }

    console.log('Successfully added stage history record. ID:', response.data.ID);
    return response.data.ID;

  } catch (error) {
    console.error('Detailed error adding stage history:', {
      error: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });
    
    return null;
  }
};

const handleNegotiationSubmit = async (formData) => {
  try {
    const targetStage = 'Negotiation';
    
    // Create a new negotiation history record with all data
    const historyRecordId = await addStageHistoryRecord(
      deal.ID, 
      targetStage, 
      userId,
      formData
    );
    
    if (historyRecordId) {
      // Update the opportunity with the negotiation history ID and stage
      const updateOpportunityConfig = {
        app_name: 'lead-management-system',
        report_name: 'All_Opportunities_Dev',
        id: deal.ID,
        payload: {
          data: {
            Negotiation_ID: historyRecordId,
            Stage: targetStage
          }
        }
      };
      
      await ZOHO.CREATOR.DATA.updateRecordById(updateOpportunityConfig);
      
      // Update local state
      setDeal(prev => ({
        ...prev,
        Stage: targetStage,
        Negotiation_ID: historyRecordId,
        pendingStage: undefined
      }));
      toast.success('Negotiation submitted successfully!')
    }
    
    setShowProposalForm(false);
    await fetchStageHistory(deal.ID);
  } catch (error) {
    console.error('Error handling negotiation submission:', error);
  }
};

// In your JSX where you render ProposalStageForm
{showProposalForm && (
  <ProposalStageForm 
    deal={deal}
    onClose={() => {
      setShowProposalForm(false);
      setDeal(prev => ({ ...prev, pendingStage: undefined }));
      setProposalData(null);
    }}
    onSubmit={deal.pendingStage === 'Negotiation' ? handleNegotiationSubmit : handleProposalSubmit}
    proposalData={proposalData}
  />
)}

const addGenericStageHistoryRecord = async (dealId, stage, userId) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentDateTime = new Date().toISOString();

    const recordData = {
      Opportunity_Name: dealId,
      Stage_Name: stage,
      Start_Date: currentDate,
      Modified_Time: currentDateTime,
      User: userId
    };

    const config = {
      app_name: 'lead-management-system',
      form_name: 'Opportunity_Stage_History',
      payload: {
        data: recordData
      }
    };

    const response = await ZOHO.CREATOR.DATA.addRecords(config);
     return response.data.ID;
  } catch (error) {
    console.error('Error adding generic stage history:', error);
    return null;
  }
};

const handleNegotiationStageClick = async () => {
  try {
    setDeal(prev => ({ ...prev, pendingStage: 'Negotiation' }));
    
    // Check if Proposal_ID exists
    if (deal.Proposal_ID) {
      const config = {
        app_name: 'lead-management-system',
        report_name: 'All_Opportunity_Stage_History_Dev',
        id: deal.Proposal_ID
      };
      
      const response = await ZOHO.CREATOR.DATA.getRecordById(config);
      if (response && response.data) {
        console.log('Fetched proposal data:', response.data);
        setProposalData(response.data);
        setShowProposalForm(true);
      } else {
        console.warn('No proposal data found for Proposal_ID:', deal.Proposal_ID);
        setProposalData(null);
        setShowProposalForm(true);
      }
    } else {
      console.warn('No Proposal_ID found for deal:', deal.ID);
      setProposalData(null);
      setShowProposalForm(true);
    }
  } catch (error) {
    console.error('Error fetching proposal data:', error);
    setProposalData(null);
    setShowProposalForm(true);
  }
}


console.log(deal)
  if (!deal) return null;

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto"
    >
      <motion.div 
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        {/* <Toaster position="top-center" /> */}
        <div className="bg-gradient-to-r from-[#f29d29] to-[#ff8c00] text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center relative">
            <h2 className="text-xl font-semibold absolute left-1/2 transform -translate-x-1/2">Deal Details</h2>
              <div className="flex items-center ml-auto space-x-3">
                <button
                    onClick={() => setShowEditForm(true)}
                    className="flex items-center  px-4 py-2 bg-white text-black rounded-lg shadow-md hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
                  >
                    {/* <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg> */}
                    Edit
                  </button>
                <button 
                  onClick={onClose} 
                  className="text-white hover:text-gray-200 text-2xl ml-auto transition-colors duration-200"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
          </div>
          <div className="mt-6 flex items-center">
            <motion.div 
              className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-[#f29d29] font-bold text-xl mr-3"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {getDealName().charAt(0).toUpperCase()}
            </motion.div>
            <div className="text-left">
              <h3 className="font-medium">{getDealName()}</h3>
              <p className="text-sm opacity-90">{getStage()}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar deal={deal} stages={stages} onStageChange={handleStageChange} />

        {/* Tabs */}
        <div className="mt-4 border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['Overview', 'Attachments', 'Notes', 'Meeting', 'Reminder'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab
                    ? 'border-[#f29d29] text-[#f29d29]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'Overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                    Opportunity Information
                  </h3>
                  <DetailItem label="Deal Name" value={getDealName()} />
                  <AccountDetailItem label="Account" value={getAccountName()} />
                  <ContactDetailItem label="Contact" value={getContactName()} />
                  <DetailItem label="Owner" value={getOwnerName()} />
                  <DetailItem label="Stage" value={getStage()} />
                  
                </div>

                {/* Financial Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                    Financial Details
                  </h3>
                  <DetailItem label="Amount" value={getAmount()} />
                  {projectStartDate() !== 'N/A' && (
                      <DetailItem label="Project Start Date" value={projectStartDate()} />
                    )}
                  {projectCloseDate() !== 'N/A' && (
                    <DetailItem label="Project Close Date" value={projectCloseDate()} />
                  )}

                  {dealStatus() !== 'N/A' && (
                    <DetailItem label="Deal Status" value={dealStatus()} />
                  )}
                  
                  
              </div>

              {/* Status Flags */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                  Status Flags
                </h3>
                <DetailItem 
                  label="Budget Confirmed" 
                  value={deal.Budget_Confirmed === true || deal.Budget_Confirmed === 'true' || deal.Budget_Confirmed === 1 ? 'Yes' : 'No'} 
                />
                <DetailItem 
                  label="Discovery Completed" 
                  value={deal.Discovery_Completed === true || deal.Discovery_Completed === 'true' || deal.Discovery_Completed === 1 ? 'Yes' : 'No'} 
                />
                <DetailItem 
                  label="ROI Analysis Completed" 
                  value={deal.ROI_Analysis_Completed === true || deal.ROI_Analysis_Completed === 'true' || deal.ROI_Analysis_Completed === 1 ? 'Yes' : 'No'}
                />
                <DetailItem
                  label="Is Converted" 
                  value={deal.Is_Converted === true || deal.Is_Converted === 'true' || deal.Is_Converted === 1 ? 'Yes' : 'No'}
 
                />
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                  Additional Information
                </h3>
                {dealLoss() !== 'N/A' && (
                  <DetailItem label="Deal Loss Reason" value={dealLoss()} />
                )}
                <DetailItem 
                  label="Created Date" 
                  value={
                    deal.Created_Time || deal.Added_Time
                      ? new Date(deal.Created_Time || deal.Added_Time).toLocaleString() 
                      : 'N/A'
                  } 
                />
                <DetailItem 
                  label="Source" 
                  value={deal.Sources ? `${deal.Sources.zc_display_value || deal.Sources?.Source_Name}` : 'N/A'} 
                />
              </div>
              {deal.Project_Type && deal.Project_Type !== 'N/A' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                    Project Details
                  </h3>
                  
                  {/* Project Type */}
                  {/* <DetailItem label="Project Type" value={deal.Project_Type || 'N/A'} /> */}

                  {/* Conditional fields based on project type */}
                  {deal.Project_Type === 'Fixed Project' && (
                    <>
                      <DetailItem label="Fixed Amount" value={deal.Fixed_Project_Amount ? `$${deal.Fixed_Project_Amount}` : 'N/A'} />
                    </>
                  )}

                  {deal.Project_Type === 'Milestone Based' && deal.Milestone_Based_Project_Subform?.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Milestones</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {deal.Milestone_Based_Project_Subform.map((milestone, index) => (
                          <div key={milestone.ID} className="mb-2 p-2 border rounded">
                            <p>
                              <span className="font-medium text-[#f29d29]" >Milestone {index + 1}<br></br> </span> <span className="font-medium" >Description: </span>{milestone.Description}
                            </p>
                            <p>
                              <span className="font-medium">Amount:</span> ${milestone.Milestone_Based_Amount}
                            </p>
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}


                  {deal.Project_Type === 'Remote Job' && (
                    <>
                      <DetailItem 
                        label="Salary Amount" 
                        value={deal.Salary_Amount ? `$${deal.Salary_Amount}` : 'N/A'} 
                      />
                      <DetailItem 
                        label="Salary Terms" 
                        value={deal.Salary_Terms || 'N/A'} 
                      />
                    </>
                  )}

                  {deal.Project_Type === 'Project Wise' && (
                    <>
                      <DetailItem 
                        label="Total Amount" 
                        value={deal.Project_Wise_Amount ? `$${deal.Project_Wise_Amount}` : 'N/A'} 
                      />
                      <DetailItem 
                        label="Upfront Percentage" 
                        value={deal.Upfront_Percentage ? `${deal.Upfront_Percentage}%` : 'N/A'} 
                      />
                      <DetailItem 
                        label="Remaining Amount" 
                        value={deal.Remaining_Amount ? `$${deal.Remaining_Amount}` : 'N/A'} 
                      />
                    </>
                  )}

                  {deal.Project_Type === 'Hourly' && (
                    <>
                      <DetailItem 
                        label="Total Hours" 
                        value={deal.Total_Hours || 'N/A'} 
                      />
                      <DetailItem 
                        label="Hourly Rate" 
                        value={deal.Hourly_Rate ? `$ ${deal.Hourly_Rate}/hr` : 'N/A'} 
                      />
                      {deal.Total_Hours && deal.Hourly_Rate && (
                        <DetailItem 
                          label="Estimated Total" 
                          value={`$${deal.Hourly_Rate * deal.Hourly_Rate}`} 
                        />
                      )}
                    </>
                  )}
                </div>
                )}

                <div className="col-span-2">
                {deal.Job_Description?.trim() && (
                    <div className="col-span-2">
                      <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                        Job Description
                      </h3>
                      <DetailItem label="" value={deal.Job_Description} />
                    </div>
                  )}



                </div>
                <div className="col-span-2 mt-8">
                  {deal?.ID && <StageHistory dealId={deal.ID} stageHistory={stageHistory}  loading={loadingHistory} />}
                </div>
            </div>
          )}
          {activeTab === 'Attachments' && deal?.ID && (
            <Attachments module="Deals" RecordId={deal?.ID} currentUser={currentUser}/>
          )}
          {activeTab === 'Notes' && (
            <Notes module="Deals" RecordId={deal?.ID} currentUser={currentUser} />
          )}
          {activeTab === 'Reminder' && (
            <Reminder module="Deals" RecordId={deal?.ID} currentUser={currentUser} comment={true}/>
          )}
          {activeTab === 'Meeting' && (
            <Meeting module="Deals" RecordId={deal?.ID} currentUser={currentUser} lead ={deal} userId={userId}/>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <motion.button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Close
            </motion.button>
          </div>
        </div>
      </motion.div>
      {showEditForm && (
      <EditDealForm 
        deal={deal} 
        onClose={() => setShowEditForm(false)}
        onUpdateSuccess={handleUpdateSuccess}
        userId={userId}
        permissions={permissions}
        currentUser={currentUser}
      />
    )}

    <AnimatePresence>
        {showMandatoryFieldsPopup && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#f29d29]">
                    {deal.pendingStage ? 'Additional Information Required' : 'Missing Mandatory Fields'}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowMandatoryFieldsPopup(false);
                      setValidationErrors({});
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {deal.pendingStage 
                    ? `Please fill in the following mandatory fields to move to the "${deal.pendingStage}" stage:`
                    : 'Please fill in the following mandatory fields to continue:'}
                </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate *
                  </label>
                  <input
                    type="number"
                    value={mandatoryFields.Hourly_Rate}
                    onChange={(e) => setMandatoryFields({
                      ...mandatoryFields,
                      Hourly_Rate: e.target.value
                    })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.Hourly_Rate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.Hourly_Rate && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.Hourly_Rate}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours *
                  </label>
                  <input
                    type="number"
                    value={mandatoryFields.Hours}
                    onChange={(e) => setMandatoryFields({
                      ...mandatoryFields,
                      Hours: e.target.value
                    })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.Hours ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.Hours && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.Hours}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Start Date *
                  </label>
                  <input
                    type="date"
                    value={mandatoryFields.Project_Start_Date}
                    onChange={(e) => setMandatoryFields({
                      ...mandatoryFields,
                      Project_Start_Date: e.target.value
                    })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.Project_Start_Date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.Project_Start_Date && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.Project_Start_Date}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Close Date *
                  </label>
                  <input
                    type="date"
                    value={mandatoryFields.Project_Close_Date}
                    onChange={(e) => setMandatoryFields({
                      ...mandatoryFields,
                      Project_Close_Date: e.target.value
                    })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.Project_Close_Date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.Project_Close_Date && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.Project_Close_Date}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowMandatoryFieldsPopup(false);
                    setValidationErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  // onClick={handleMandatoryFieldsSubmit}
                  // className="px-4 py-2 bg-[#f29d29] text-white rounded-md text-sm font-medium hover:bg-[#e08a1a]"
                >
                  Submit & Update Stage
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
      </AnimatePresence>
      {showProposalForm && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProposalStageForm 
              deal={deal}
              onClose={() => {
                setShowProposalForm(false);
                setDeal(prev => ({ ...prev, pendingStage: undefined }));
                setProposalData(null); 
              }}
              onSubmit={deal.pendingStage === 'Negotiation' ? handleNegotiationSubmit : handleProposalSubmit}
              proposalData={proposalData}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {showCloseDealPopup && (
          <AnimatePresence>
            <motion.div 
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#f29d29]">
                    Close Deal - {deal.pendingStage}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowCloseDealPopup(false);
                      setDeal(prev => ({ ...prev, pendingStage: undefined }));
                      setValidationErrors({});
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Project Type (readonly) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Type
                    </label>
                    <input
                      type="text"
                      value={closeDealData.projectType}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>
                  
                  {/* Deal Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deal Status *
                    </label>
                    <select
                      value={closeDealData.status}
                      onChange={(e) => setCloseDealData({
                        ...closeDealData,
                        status: e.target.value
                      })}
                      className={`w-full px-3 py-2 border rounded-md ${
                        validationErrors.status ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Status</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                    {validationErrors.status && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.status}</p>
                    )}
                  </div>
                  
                  {/* Conditionally show fields based on status */}
                  {closeDealData.status === 'Won' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Start Date *
                          </label>
                          <input
                            type="date"
                            value={closeDealData.projectStartDate}
                            onChange={(e) => setCloseDealData({
                              ...closeDealData,
                              projectStartDate: e.target.value
                            })}
                            className={`w-full px-3 py-2 border rounded-md ${
                              validationErrors.projectStartDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {validationErrors.projectStartDate && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.projectStartDate}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Close Date *
                          </label>
                          <input
                            type="date"
                            value={closeDealData.projectCloseDate}
                            onChange={(e) => setCloseDealData({
                              ...closeDealData,
                              projectCloseDate: e.target.value
                            })}
                            className={`w-full px-3 py-2 border rounded-md ${
                              validationErrors.projectCloseDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {validationErrors.projectCloseDate && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.projectCloseDate}</p>
                          )}
                        </div>
                      </>
                    )}
                  
                  {closeDealData.status === 'Lost' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Loss *
                      </label>
                      <textarea
                        value={closeDealData.lossReason}
                        onChange={(e) => setCloseDealData({
                          ...closeDealData,
                          lossReason: e.target.value
                        })}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md ${
                          validationErrors.lossReason ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Explain why the deal was lost..."
                      />
                      {validationErrors.lossReason && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.lossReason}</p>
                      )}
                    </div>
                  )}

                  {/* Project Type Specific Fields */}
                  {closeDealData.projectType === 'Fixed Project' && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-700 border-b pb-1">
                        Fixed Project Details
                      </h4>
                      <DetailItem label="Fixed Amount" value={deal.Amount ? `$${deal.Amount}` : 'N/A'} />
                    </div>
                  )}

                  {closeDealData.projectType === 'Milestone Based' && deal.Milestone_Based_Project_Subform?.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-700 border-b pb-1">
                        Milestone Details
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Milestones</label>
                        <div className="mt-1 text-sm text-gray-900">
                          {deal.Milestone_Based_Project_Subform.map((milestone, index) => (
                            <div key={milestone.ID} className="mb-2 p-2 border rounded">
                              <p>
                                <span className="font-medium text-[#f29d29]">Milestone {index + 1}</span><br />
                                <span className="font-medium">Description: </span>{milestone.Description}
                              </p>
                              <p>
                                <span className="font-medium">Amount:</span> ${milestone.Milestone_Based_Amount}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {closeDealData.projectType === 'Remote Job' && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-700 border-b pb-1">
                        Remote Job Details
                      </h4>
                      <DetailItem label="Salary Amount" value={deal.Salary_Amount ? `$${deal.Salary_Amount}` : 'N/A'} />
                      <DetailItem label="Salary Terms" value={deal.Salary_Terms || 'N/A'} />
                    </div>
                  )}

                  {closeDealData.projectType === 'Project Wise' && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-700 border-b pb-1">
                        Project Wise Details
                      </h4>
                      <DetailItem label="Total Amount" value={deal.Project_Wise_Amount ? `$${deal.Project_Wise_Amount}` : 'N/A'} />
                      <DetailItem label="Upfront Percentage" value={deal.Upfront_Percentage ? `${deal.Upfront_Percentage}%` : 'N/A'} />
                      <DetailItem label="Remaining Amount" value={deal.Remaining_Amount ? `$${deal.Remaining_Amount}` : 'N/A'} />
                    </div>
                  )}

                  {closeDealData.projectType === 'Hourly' && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-700 border-b pb-1">
                        Hourly Project Details
                      </h4>
                      <DetailItem label="Total Hours" value={deal.Total_Hours || 'N/A'} />
                      <DetailItem label="Hourly Rate" value={deal.Hourly_Rate ? `$${deal.Hourly_Rate}/hr` : 'N/A'} />
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCloseDealPopup(false);
                      setDeal(prev => ({ ...prev, pendingStage: undefined }));
                      setValidationErrors({});
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloseDealSubmit}
                    className="px-4 py-2 bg-[#f29d29] text-white rounded-md text-sm font-medium hover:bg-[#e08a1a]"
                  >
                    Submit & Close Deal
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

    </motion.div>
  );
};

const DetailItem = ({ label, value, children, isLink = false }) => {
  const displayValue = value !== undefined && value !== null ? String(value) : 'N/A';

  if (children) {
    return (
      <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{children}</dd>
      </div>
    );
  }

  if (isLink && displayValue !== 'N/A') {
    const url = value.startsWith('http') ? value : `https://${value}`;
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



export default DealDetailsPage;