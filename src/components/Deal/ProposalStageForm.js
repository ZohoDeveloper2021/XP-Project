/* global ZOHO */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ProposalStageForm = ({ deal, onClose, onSubmit, proposalData }) => {
  const [projectType, setProjectType] = useState(proposalData?.Project_Type || '');
  const [formData, setFormData] = useState({
    amount: proposalData?.Fixed_Project_Amount || '',
    milestones: proposalData?.Milestone_Based_Project_Subform || 
               [{ Description: '', Milestone_Based_Amount: '' }],
    salaryAmount: proposalData?.Salary_Amount || '',
    salaryTerms: proposalData?.Salary_Terms || 'Monthly',
    totalAmount: proposalData?.Project_Wise_Amount || '',
    upfrontPercentage: proposalData?.Upfront_Percentage || '',
    hours: proposalData?.Total_Hours || '',
    hourlyRate: proposalData?.Hourly_Rate || '', // Changed to Hourly_Rate
    // closeDate: proposalData?.Closing_Date || ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Added for error feedback

  // Set form title based on whether we're in negotiation or proposal
  const formTitle = deal?.pendingStage === 'Negotiation' ? 'Negotiation Information' : 'Proposal Information';

  // Initialize form when proposalData changes
  useEffect(() => {
    if (proposalData) {
      setProjectType(proposalData.Project_Type || '');
      setFormData({
        amount: proposalData.Fixed_Project_Amount || '',
        milestones: proposalData.Milestone_Based_Project_Subform || 
                  [{ Description: '', Milestone_Based_Amount: '' }],
        salaryAmount: proposalData.Salary_Amount || '',
        salaryTerms: proposalData.Salary_Terms || 'Monthly',
        totalAmount: proposalData.Project_Wise_Amount || '',
        upfrontPercentage: proposalData.Upfront_Percentage || '',
        hours: proposalData.Total_Hours || '',
        hourlyRate: proposalData.Hourly_Rate || '', // Changed to Hourly_Rate
        // closeDate: proposalData.Closing_Date || ''
      });
    }
  }, [proposalData]);

  const handleMilestoneChange = (index, field, value) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index][field] = value;
    setFormData({ ...formData, milestones: updatedMilestones });
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { Description: '', Milestone_Based_Amount: '' }]
    });
  };

  const removeMilestone = (index) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones.splice(index, 1);
    setFormData({ ...formData, milestones: updatedMilestones });
  };

  const formatDateForZoho = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setErrorMessage(''); // Clear previous errors
    const errors = {};
    
    if (!projectType) {
      errors.projectType = 'Project type is required';
    }
    
    // Validate based on project type
    switch (projectType) {
      case 'Fixed Project':
        if (!formData.amount) errors.amount = 'Amount is required';
        break;
      case 'Milestone Based':
        formData.milestones.forEach((milestone, index) => {
          if (!milestone.Description) errors[`milestoneDesc_${index}`] = 'Description is required';
          if (!milestone.Milestone_Based_Amount) errors[`milestoneAmount_${index}`] = 'Amount is required';
        });
        break;
      case 'Remote Job':
        if (!formData.salaryAmount) errors.salaryAmount = 'Salary amount is required';
        break;
      case 'Project Wise':
        if (!formData.totalAmount) errors.totalAmount = 'Total amount is required';
        if (!formData.upfrontPercentage) errors.upfrontPercentage = 'Upfront percentage is required';
        break;
      case 'Hourly':
        if (!formData.hours) errors.hours = 'Hours are required';
        if (!formData.hourlyRate) errors.hourlyRate = 'Hourly rate is required';
        break;
      default:
        errors.projectType = 'Please select a valid project type';
    }
    
    // if (!formData.closeDate) errors.closeDate = 'Close date is required';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare payload for Zoho Creator
      const payload = {
        Project_Type: projectType,
        Stage: deal.pendingStage || 'Proposal',
        // Close_Date: formatDateForZoho(formData.closeDate)
      };

      // Add fields based on project type
      switch (projectType) {
        case 'Fixed Project':
          payload.Fixed_Project_Amount = parseFloat(formData.amount);
          break;
        case 'Milestone Based':
          payload.Milestone_Based_Project_Subform = formData.milestones.map(m => ({
            Description: m.Description,
            Milestone_Based_Amount: parseFloat(m.Milestone_Based_Amount)
          }));
          break;
        case 'Remote Job':
          payload.Salary_Amount = parseFloat(formData.salaryAmount);
          payload.Salary_Terms = formData.salaryTerms;
          break;
        case 'Project Wise':
          payload.Project_Wise_Amount = parseFloat(formData.totalAmount);
          payload.Upfront_Percentage = parseFloat(formData.upfrontPercentage);
          payload.Remaining_Amount = parseFloat(formData.totalAmount) - (parseFloat(formData.totalAmount) * (parseFloat(formData.upfrontPercentage) / 100));
          break;
        case 'Hourly':
          payload.Total_Hours = parseFloat(formData.hours);
          payload.Hourly_Rate = parseFloat(formData.hourlyRate); // Changed to Hourly_Rate
          break;
      }

      console.log('Submitting payload:', payload); // Debug payload

      // Call the parent onSubmit with the updated data
      await onSubmit(payload);
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMessage('Failed to submit the form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            {formTitle}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        {errorMessage && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Type *
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  validationErrors.projectType ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">Select Project Type</option>
                <option value="Fixed Project">Fixed Project</option>
                <option value="Milestone Based">Milestone Based</option>
                <option value="Remote Job">Remote Job</option>
                <option value="Project Wise">Project Wise</option>
                <option value="Hourly">Hourly</option>
              </select>
              {validationErrors.projectType && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.projectType}</p>
              )}
            </div>
            
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Close Date *
              </label>
              <input
                type="date"
                value={formData.closeDate}
                onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  validationErrors.closeDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {validationErrors.closeDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.closeDate}</p>
              )}
            </div> */}

            {/* Fixed Project Fields */}
            {projectType === 'Fixed Project' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md ${
                    validationErrors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {validationErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                )}
              </div>
            )}
            
            {/* Milestone Based Fields */}
            {projectType === 'Milestone Based' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Milestones
                </label>
                {formData.milestones.map((milestone, index) => (
                  <div key={index} className="mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Milestone {index + 1}</span>
                      {index > 0 && (
                        <button 
                          type="button" 
                          onClick={() => removeMilestone(index)}
                          className="text-red-500 text-sm"
                          disabled={isLoading}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Description"
                      value={milestone.Description}
                      onChange={(e) => handleMilestoneChange(index, 'Description', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${
                        validationErrors[`milestoneDesc_${index}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    {validationErrors[`milestoneDesc_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors[`milestoneDesc_${index}`]}</p>
                    )}
                    <input
                      type="number"
                      placeholder="Amount"
                      value={milestone.Milestone_Based_Amount}
                      onChange={(e) => handleMilestoneChange(index, 'Milestone_Based_Amount', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${
                        validationErrors[`milestoneAmount_${index}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    {validationErrors[`milestoneAmount_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors[`milestoneAmount_${index}`]}</p>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMilestone}
                  className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                  disabled={isLoading}
                >
                  + Add Milestone
                </button>
              </div>
            )}
            
            {/* Remote Job Fields */}
            {projectType === 'Remote Job' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.salaryAmount}
                    onChange={(e) => setFormData({ ...formData, salaryAmount: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.salaryAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {validationErrors.salaryAmount && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.salaryAmount}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Terms
                  </label>
                  <select
                    value={formData.salaryTerms}
                    onChange={(e) => setFormData({ ...formData, salaryTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={isLoading}
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Project Wise Fields */}
            {projectType === 'Project Wise' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.totalAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {validationErrors.totalAmount && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.totalAmount}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upfront Percentage *
                  </label>
                  <input
                    type="number"
                    value={formData.upfrontPercentage}
                    onChange={(e) => setFormData({ ...formData, upfrontPercentage: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.upfrontPercentage ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {validationErrors.upfrontPercentage && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.upfrontPercentage}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remaining Amount
                  </label>
                  <input
                    type="number"
                    value={
                      formData.totalAmount && formData.upfrontPercentage 
                        ? formData.totalAmount - (formData.totalAmount * (formData.upfrontPercentage / 100))
                        : ''
                    }
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
            
            {/* Hourly Fields */}
            {projectType === 'Hourly' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Hours *
                  </label>
                  <input
                    type="number"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.hours ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {validationErrors.hours && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.hours}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate *
                  </label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.hourlyRate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {validationErrors.hourlyRate && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.hourlyRate}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#f29d29] text-white rounded-md text-sm font-medium hover:bg-[#e08a1a]"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProposalStageForm;