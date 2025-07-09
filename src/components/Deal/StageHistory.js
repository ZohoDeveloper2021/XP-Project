/* global ZOHO */
import { useState, useEffect } from 'react';

const StageHistory = ({ dealId, stageHistory, loading }) => {
  const [selectedStage, setSelectedStage] = useState(null);
  const [stageDetails, setStageDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const getStageBgColor = (stageName) => {
    switch (stageName) {
      case 'Discovery':
        return 'bg-blue-100 text-blue-800';
      case 'Proposal':
        return 'bg-purple-100 text-purple-800';
      case 'Negotiation':
        return 'bg-yellow-100 text-yellow-800';
      case 'Close Won/Lost':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };
console.log(selectedStage)
  const handleStageClick = async (history) => {
    setSelectedStage(history);
    setLoadingDetails(true);

    try {
      const config = {
        app_name: 'lead-management-system',
        report_name: 'All_Opportunity_Stage_History_Dev',
        id: history.ID,
      };

      const response = await ZOHO.CREATOR.DATA.getRecordById(config);
      setStageDetails(response.data);
    } catch (error) {
      console.error('Error fetching stage details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const renderProjectTypeFields = () => {
    if (!stageDetails?.Project_Type) return null;

    switch (stageDetails.Project_Type) {
      case 'Fixed Project':
        return (
          <div className="p-3 border rounded-lg mb-4">
            <p><strong>Project Type:</strong> Fixed Project</p>
            <p><strong>Amount:</strong> {stageDetails.Fixed_Project_Amount ? `$${stageDetails.Fixed_Project_Amount}` : 'N/A'}</p>
          </div>
        );

      case 'Milestone Based':
        return (
          <div className="p-3 border rounded-lg mb-4">
            <p><strong>Project Type:</strong> Milestone Based</p>
            {stageDetails.Milestone_Based_Project_Subform?.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Milestones:</p>
                {stageDetails.Milestone_Based_Project_Subform.map((milestone, index) => (
                  <div key={index} className="mt-2 p-2 border rounded">
                    <p><strong>Description:</strong> {milestone.Description || 'N/A'}</p>
                    <p><strong>Amount:</strong> {milestone.Milestone_Based_Amount ? `$${milestone.Milestone_Based_Amount}` : 'N/A'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'Project Wise':
        return (
          <div className="p-3 border rounded-lg mb-4">
            <p><strong>Project Type:</strong> Project Wise</p>
            <p><strong>Total Amount:</strong> {stageDetails.Project_Wise_Amount ? `$${stageDetails.Project_Wise_Amount}` : 'N/A'}</p>
            <p><strong>Upfront Percentage:</strong> {stageDetails.Upfront_Percentage ? `${stageDetails.Upfront_Percentage}%` : 'N/A'}</p>
            <p><strong>Remaining Amount:</strong> {stageDetails.Remaining_Amount ? `$${stageDetails.Remaining_Amount}` : 'N/A'}</p>
          </div>
        );

      case 'Remote Job':
        return (
          <div className="p-3 border rounded-lg mb-4">
            <p><strong>Project Type:</strong> Remote Job</p>
            <p><strong>Salary Amount:</strong> {stageDetails.Salary_Amount ? `$${stageDetails.Salary_Amount}` : 'N/A'}</p>
            <p><strong>Salary Terms:</strong> {stageDetails.Salary_Terms || 'N/A'}</p>
          </div>
        );

      case 'Hourly':
        return (
          <div className="p-3 border rounded-lg mb-4">
            <p><strong>Project Type:</strong> Hourly</p>
            <p><strong>Total Hours:</strong> {stageDetails.Total_Hours || 'N/A'}</p>
            <p><strong>Hourly Rate:</strong> {stageDetails.Hourly_Rate ? `$${stageDetails.Hourly_Rate}/hr` : 'N/A'}</p>
            {stageDetails.Total_Hours && stageDetails.Hourly_Rate && (
              <p><strong>Estimated Total:</strong> ${stageDetails.Total_Hours * stageDetails.Hourly_Rate}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderStageDetails = () => {
    if (!selectedStage || !stageDetails) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-[#f29d29]">
              {selectedStage.Stage_Name} Stage Details
            </h3>
            <button
              onClick={() => setSelectedStage(null)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {loadingDetails ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f29d29]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Basic info */}
              <div className="p-3 border rounded-lg">
                <p><strong>Stage:</strong> {selectedStage.Stage_Name}</p>
                <p><strong>Modified Time:</strong> {formatDateTime(selectedStage.Modified_Time || selectedStage.Added_Time) }</p>
                <p><strong>Modified By:</strong> {stageDetails.User?.zc_display_value || 'N/A'}</p>
              </div>

              {/* Close Won/Lost specific fields */}
              {selectedStage.Stage_Name === 'Close Won/Lost' && (
                <div className="p-3 border rounded-lg mb-4">
                  <p><strong>Deal Status:</strong> {stageDetails.Deal_Status || 'N/A'}</p>
                  {stageDetails.Deal_Status === 'Won' && (
                    <>
                      <p><strong>Project Start Date:</strong> {stageDetails.Project_Start_Date || 'N/A'}</p>
                      <p><strong>Project Close Date:</strong> {stageDetails.Project_Close_Date || 'N/A'}</p>
                    </>
                  )}
                  {stageDetails.Deal_Status === 'Lost' && (
                    <p><strong>Reason for Loss:</strong> {stageDetails.Deal_Loss_Reason || 'N/A'}</p>
                  )}
                </div>
              )}

              {/* Project type specific fields */}
              {renderProjectTypeFields()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div className="p-4">Loading stage history...</div>;
  if (stageHistory.length === 0) return <div className="p-4">No stage history available</div>;

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium text-[#f29d29] mb-4">Stage History</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified By</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stageHistory.map((history, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleStageClick(history)}
                    className={`px-2 py-2 text-sm font-medium rounded-2xl capitalize ${getStageBgColor(history.Stage_Name)} hover:opacity-80 hover:underline`}
                  >
                    {history.Stage_Name}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(history.Modified_Time || history.Added_Time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {history.User?.zc_display_value || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Render the stage details popup */}
      {renderStageDetails()}
    </div>
  );
};

export default StageHistory;