import { useStaffAuth } from '../../context/StaffAuthContext'
import { useBarangay } from '../../context/BarangayContext'

export default function BarangayManagementSection({ isDarkMode }) {
  const { staffAccounts } = useStaffAuth()
  const { getAllBarangays } = useBarangay()

  const allBarangays = getAllBarangays()

  const getStaffForBarangay = (barangayName) => {
    return staffAccounts.filter((staff) => staff.barangay === barangayName)
  }

  const getTotalData = () => {
    return allBarangays.reduce(
      (totals, barangay) => ({
        residents: totals.residents + parseInt(barangay.residents.replace(/,/g, '')),
        families: totals.families + parseInt(barangay.registeredFamilies),
        iwpa: totals.iwpa + parseInt(barangay.iwpaCount),
        distributions: totals.distributions + parseInt(barangay.activeDistributions),
      }),
      { residents: 0, families: 0, iwpa: 0, distributions: 0 },
    )
  }

  const totals = getTotalData()

  return (
    <div id="barangay-management-section" className="mt-10">
      {/* HEADER */}
      <div className="mb-8">
        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Barangay Management
        </h3>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Overview of all barangays and assigned staff
        </p>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Residents
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {totals.residents.toLocaleString()}
          </h3>
        </div>

        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Registered Families
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {totals.families.toLocaleString()}
          </h3>
        </div>

        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Pending Assistance (IWPA)
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {totals.iwpa}
          </h3>
        </div>

        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Active Distributions
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {totals.distributions}
          </h3>
        </div>
      </div>

      {/* BARANGAY TABLE */}
      <div
        className={`rounded-2xl border p-6 overflow-x-auto transition ${
          isDarkMode
            ? 'bg-[#111c2e] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          All Barangays
        </h4>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Barangay
              </th>
              <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Captain
              </th>
              <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Assigned Staff
              </th>
              <th className={`text-center py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Families
              </th>
              <th className={`text-center py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                IWPA
              </th>
              <th className={`text-center py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Distributions
              </th>
            </tr>
          </thead>
          <tbody>
            {allBarangays.map((barangay) => {
              const assignedStaff = getStaffForBarangay(barangay.name)
              return (
                <tr
                  key={barangay.name}
                  className={`border-b transition ${
                    isDarkMode
                      ? 'border-slate-700 hover:bg-slate-800'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <td className={`py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {barangay.name}
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {barangay.captain}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {assignedStaff.length > 0 ? (
                        assignedStaff.map((staff) => (
                          <span
                            key={staff.username}
                            className="inline-block bg-blue-600 text-white text-xs py-1 px-2 rounded-full"
                          >
                            {staff.name}
                          </span>
                        ))
                      ) : (
                        <span className={`text-xs italic ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                          No staff assigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`py-3 px-4 text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {barangay.registeredFamilies}
                  </td>
                  <td className={`py-3 px-4 text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {barangay.iwpaCount}
                  </td>
                  <td className={`py-3 px-4 text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {barangay.activeDistributions}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
