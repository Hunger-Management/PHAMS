import { Trash2, Download } from 'lucide-react'

export default function TransparencySection({ isDarkMode }) {
  // Mock transparency data
  const recentActivities = [
    {
      id: 1,
      date: '2024-04-25',
      time: '2:30 PM',
      action: 'Food Distribution',
      details: 'Distributed 50 food packs to Poblacion barangay',
      staff: 'Maria Santos',
      status: 'Completed',
    },
    {
      id: 2,
      date: '2024-04-25',
      time: '1:15 PM',
      action: 'New Family Registration',
      details: '5 new families registered in San Pedro',
      staff: 'John Reyes',
      status: 'Completed',
    },
    {
      id: 3,
      date: '2024-04-24',
      time: '4:45 PM',
      action: 'Inventory Update',
      details: 'Rice inventory updated - received 100 sacks',
      staff: 'Admin System',
      status: 'Completed',
    },
    {
      id: 4,
      date: '2024-04-24',
      time: '11:20 AM',
      action: 'Cash Assistance',
      details: 'Provided cash assistance to 25 families',
      staff: 'Elena Cruz',
      status: 'Completed',
    },
    {
      id: 5,
      date: '2024-04-23',
      time: '3:00 PM',
      action: 'Medical Assistance',
      details: 'Coordinated medical checkup for 15 families',
      staff: 'Dr. Robert Santos',
      status: 'Completed',
    },
  ]

  const assistanceBreakdown = [
    { category: 'Food Packs', count: 245, percentage: 35 },
    { category: 'Rice Distribution', count: 180, percentage: 26 },
    { category: 'Cash Assistance', count: 160, percentage: 23 },
    { category: 'Medical Support', count: 95, percentage: 14 },
    { category: 'Other Programs', count: 20, percentage: 3 },
  ]

  const barangayDistribution = [
    { barangay: 'Poblacion', families: 450, percentage: 18 },
    { barangay: 'Tabacalera', families: 380, percentage: 15 },
    { barangay: 'San Roque', families: 340, percentage: 14 },
    { barangay: 'Magtanggol', families: 310, percentage: 12 },
    { barangay: 'Aguho', families: 290, percentage: 11 },
    { barangay: 'Others', families: 397, percentage: 30 },
  ]

  const handleDownload = () => {
    alert('Downloading transparency report...')
  }

  return (
    <div id="transparency-section" className="mt-10">
      {/* HEADER */}
      <div className="mb-8">
        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          System Transparency
        </h3>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Complete activity log and assistance breakdown
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
            Total Assistance Given
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            690
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            All forms of assistance
          </p>
        </div>

        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Families Served
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            2,547
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            This month
          </p>
        </div>

        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Active Staff
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            24
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            Across all barangays
          </p>
        </div>

        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Compliance Rate
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            98%
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            Reports submitted on time
          </p>
        </div>
      </div>

      {/* MAIN CONTENT - TWO COLUMNS */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* RECENT ACTIVITIES */}
        <div
          className={`rounded-2xl border p-6 transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Recent Activities
          </h4>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-xl border transition ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {activity.action}
                    </p>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {activity.details}
                    </p>
                    <div className={`flex items-center gap-4 mt-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>📅 {activity.date}</span>
                      <span>🕐 {activity.time}</span>
                      <span>👤 {activity.staff}</span>
                    </div>
                  </div>
                  <span className="inline-block bg-green-600 text-white text-xs py-1 px-2 rounded-full whitespace-nowrap">
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ASSISTANCE BREAKDOWN */}
        <div
          className={`rounded-2xl border p-6 transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Assistance Breakdown
          </h4>
          <div className="space-y-3">
            {assistanceBreakdown.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    {item.category}
                  </span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BARANGAY DISTRIBUTION */}
      <div
        className={`rounded-2xl border p-6 mb-8 transition ${
          isDarkMode
            ? 'bg-[#111c2e] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Assistance Distribution by Barangay
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {barangayDistribution.map((item) => (
            <div
              key={item.barangay}
              className={`p-4 rounded-xl border transition ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-800/50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {item.barangay}
                </p>
                <span className={`text-xs font-bold px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  {item.percentage}%
                </span>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {item.families} families
              </p>
              <div
                className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              >
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div
        className={`rounded-2xl border p-6 transition ${
          isDarkMode
            ? 'bg-[#111c2e] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Actions
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition"
          >
            <Download size={18} />
            Download Report
          </button>
          <button className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white py-2.5 px-4 rounded-lg font-medium transition">
            <span>📊</span>
            View Analytics
          </button>
          <button className={`flex items-center gap-2 py-2.5 px-4 rounded-lg font-medium transition ${
            isDarkMode
              ? 'border border-slate-600 text-slate-200 hover:bg-slate-800'
              : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}>
            <span>🔄</span>
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
}
