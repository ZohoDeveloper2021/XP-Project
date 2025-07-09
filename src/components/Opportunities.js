/* global ZOHO */
import React, { useState, useEffect } from "react";
import { Eye, Users, Briefcase, Layers, Building } from "lucide-react";
import DealDetailsPage from "./Deal/DealDetailsPage";

const Opportunities = ({ module, RecordId, currentUser, setActiveTabMain }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirectToDeal, setRedirectToDeal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const handleOpportunityClick = (opportunity) => {
    if (!opportunity.ID) return;

    localStorage.setItem("selectedDealId", opportunity.ID);
    setSelectedDeal(opportunity);
    setRedirectToDeal(true);
    if (setActiveTabMain) setActiveTabMain("Deals");
  };

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);

        // Determine the criteria based on the module type
        let criteria;
        if (module === "Accounts") {
          criteria = `(Accounts.ID == ${RecordId})`;
        } else if (module === "Contacts") {
          criteria = `(Contacts.ID == ${RecordId})`;
        } else {
          setError("Invalid module type");
          return;
        }

        const response = await ZOHO.CREATOR.DATA.getRecords({
          app_name: "lead-management-system",
          report_name: "All_Opportunities_Dev",
          criteria: criteria,
        });

        if (response.code === 3000 && response.data) {
          setOpportunities(response.data);
        } else {
          setError("Failed to fetch opportunities");
        }
      } catch (err) {
        console.error("Error fetching opportunities:", err);
        setError("No opportunities exist for this record");
      } finally {
        setLoading(false);
      }
    };

    if (RecordId && module) {
      fetchOpportunities();
    }
  }, [RecordId, module]);

  if (redirectToDeal && selectedDeal) {
    return (
      <DealDetailsPage
        deal={selectedDeal}
        onClose={() => {
          localStorage.removeItem("selectedDealId");
          setRedirectToDeal(false);
        }}
        currentUser={currentUser}
      />
    );
  }
  console.log(opportunities);
  const getStageColor = (stage) => {
    const stageColors = {
      "On Boarded": "bg-orange-100 text-orange-800",
      Discovery: "bg-yellow-100 text-yellow-800",
      Proposal: "bg-blue-100 text-blue-800",
      Negotiation: "bg-green-100 text-green-800",
      "Close Won/Lost": "bg-red-100 text-red-800",
    };
    return stageColors[stage] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className=" flex items-center justify-center mt-5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">
          No opportunities found for this {module}.
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Check back later for new opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="border-b border-gray-200 px-5 py-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-2xl font-semibold">Associated Opportunities</h3>
          </div>
          <div className="bg-white bg-opacity-50 rounded-full px-2">
            {/* <span className="font-semibold text-black text-sm">{opportunities.length}</span> */}
          </div>
        </div>
      </div>

      {/* Compact Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="py-2 px-3 text-left">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Opportunity Name
                    </span>
                  </div>
                </th>
                <th className="py-2 px-3 text-left">
                  <div className="flex items-center space-x-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#f29d29" }}
                    ></div>
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Stage
                    </span>
                  </div>
                </th>
                <th className="py-2 px-3 text-left">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Contact
                    </span>
                  </div>
                </th>
                <th className="py-2 px-3 text-left">
                  <div className="flex items-center space-x-1">
                    <Layers className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Account
                    </span>
                  </div>
                </th>
                <th className="py-2 px-3 text-left">
                  <div className="flex items-center space-x-1">
                    <Building className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Amount
                    </span>
                  </div>
                </th>
                {module === "accounts" && (
                  <th className="py-2 px-3 text-left">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Contact
                      </span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {opportunities.map((opp, index) => (
                <tr
                  key={opp.ID}
                  className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all duration-200 group cursor-pointer"
                  onClick={() => handleOpportunityClick(opp)}
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full group-hover:bg-orange-500 transition-colors"
                        style={{ backgroundColor: "#f29d29" }}
                      ></div>
                      <span className="font-medium text-gray-900 group-hover:text-orange-700 text-sm hover:underline">
                        {opp.Opportunity_Name || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(
                        opp.Stage || "N/A"
                      )}`}
                    >
                      {opp.Stage || "On Boarded"}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-1">
                      <div className="bg-orange-100 rounded-full p-0.5">
                        <Users className="w-2.5 h-2.5 text-orange-600" />
                      </div>
                      <span className="text-gray-900 font-medium text-sm">
                        {opp.Contacts.zc_display_value || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-gray-700 bg-gray-50 px-2 py-0.5 rounded text-xs">
                      {opp.Accounts.zc_display_value || "No Account"}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-gray-700 bg-gray-50 px-2 py-0.5 rounded text-xs">
                      {opp.Amount || "0"} $
                    </span>
                  </td>
                  {module === "accounts" && (
                    <td className="py-2 px-3">
                      <span className="text-gray-700 bg-gray-50 px-2 py-0.5 rounded text-xs">
                        {opp.Contacts?.zc_display_value ||
                          opp.Contacts ||
                          "N/A"}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Footer */}
      <div className="bg-gray-50 rounded-lg p-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Showing {opportunities.length}{" "}
            {opportunities.length === 1 ? "opportunity" : "opportunities"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Opportunities;
