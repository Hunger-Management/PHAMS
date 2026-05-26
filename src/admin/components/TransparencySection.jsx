import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, Pencil, Trash2 } from 'lucide-react'
import { apiFetch } from '../../api/api'
import { formatDistributionDetails, getCurrentStaffActor } from '../../utils/staffActivity'

function Sparkline({ data, color }) {
  const max = Math.max(...data, 1)
  const w = 80
  const h = 28
  const pts = data
    .map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - 4 - (v / max) * (h - 8)}`)
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {data.map((v, i) => (
        <circle
          key={i}
          cx={(i / Math.max(data.length - 1, 1)) * w}
          cy={h - 4 - (v / max) * (h - 8)}
          r="2"
          fill={color}
        />
      ))}
    </svg>
  )
}

function getDistributionStatus(distribution) {
  return distribution?.image ? 'Completed' : (distribution?.status || 'Pending')
}

export default function TransparencySection({ isDarkMode }) {
  const [distributions, setDistributions] = useState([])
  const [foodSupplies, setFoodSupplies] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [editingDistribution, setEditingDistribution] = useState(null)
  const [editingStatus, setEditingStatus] = useState('Pending')
  const [savingStatus, setSavingStatus] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [proofDistribution, setProofDistribution] = useState(null)

  const loadTransparencyData = async () => {
    setLoading(true)
    setError('')
    setActionError('')
    try {
      const [distData, supplyData, logData, usersData] = await Promise.all([
        apiFetch('/api/distributions'),
        apiFetch('/api/food-supplies'),
        apiFetch('/api/activity-logs?limit=12'),
        apiFetch('/api/users'),
      ])

      setDistributions(Array.isArray(distData) ? distData : [])
      setFoodSupplies(Array.isArray(supplyData) ? supplyData : [])
      setActivityLogs(Array.isArray(logData) ? logData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (err) {
      setError(err.message || 'Failed to load transparency data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransparencyData()
  }, [])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (!document.hidden) {
        loadTransparencyData()
      }
    }

    const intervalId = window.setInterval(refreshWhenVisible, 15000)
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  // Cleanup body overflow when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const formatDate = (value) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTimestamp = (value) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const recentActivities = useMemo(() => {
    const sorted = [...activityLogs].sort((a, b) => {
      const aTime = new Date(a.performed_at || a.created_at || 0).getTime()
      const bTime = new Date(b.performed_at || b.created_at || 0).getTime()
      return bTime - aTime
    })

    return sorted.slice(0, 5).map((activity, index) => {
      const action = String(activity.action || 'updated').toLowerCase()
      const actionLabelMap = {
        created: 'Created',
        distributed: 'Distributed',
        updated: 'Updated',
        deleted: 'Deleted',
      }
      const staffName = activity.staff_name || 'System'
      const staffId = activity.staff_user_id ? `#${activity.staff_user_id}` : 'n/a'

      return {
        id: activity.distribution_id || index,
        action: actionLabelMap[action] || 'Updated',
        timestamp: formatTimestamp(activity.performed_at || activity.created_at || activity.date_given),
        staff: `${staffName} (${staffId})`,
        details: activity.distribution_details || formatDistributionDetails(activity),
        status: activity.image ? 'Completed' : (activity.status || 'Pending'),
      }
    })
  }, [activityLogs])

  const assistanceBreakdown = useMemo(() => {
    const totals = foodSupplies.map((supply) => ({
      category: supply.food_name || 'Unknown',
      count: Number(supply.total_quantity) || 0,
    }))

    const totalCount = totals.reduce((sum, item) => sum + item.count, 0)
    return totals
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
      }))
  }, [foodSupplies])

  const barangayDistribution = useMemo(() => {
    const counts = distributions.reduce((acc, item) => {
      const key = item.barangay_name || 'Unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const items = Object.entries(counts).map(([barangay, families]) => ({ barangay, families }))
    const total = items.reduce((sum, item) => sum + item.families, 0)

    return items
      .sort((a, b) => b.families - a.families)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        percentage: total > 0 ? Math.round((item.families / total) * 100) : 0,
      }))
  }, [distributions])

  const summaryStats = useMemo(() => {
    const totalAssistance = distributions.length
    const uniqueFamilies = new Set(
      distributions.map((item) => item.family_id).filter((value) => value !== null && value !== undefined),
    )
    const totalCompleted = distributions.filter((item) => getDistributionStatus(item) !== 'Pending').length
    const complianceRate = totalAssistance > 0
      ? Math.round((totalCompleted / totalAssistance) * 100)
      : 0
    const activeStaff = users.filter((user) => String(user.role || '').toLowerCase() === 'staff').length

    return {
      totalAssistance,
      familiesServed: uniqueFamilies.size,
      activeStaff,
      complianceRate,
    }
  }, [distributions, users])

  const analyticsData = useMemo(() => {
    const now = new Date()
    const thisYear = now.getFullYear()
    const thisMonthIdx = now.getMonth()
    const lastMonthDate = new Date(thisYear, thisMonthIdx - 1, 1)
    const lastYear = lastMonthDate.getFullYear()
    const lastMonthIdx = lastMonthDate.getMonth()

    const inMonth = (d, year, month) => {
      if (!d.date_given) return false
      const date = new Date(d.date_given)
      return date.getFullYear() === year && date.getMonth() === month
    }

    const calcMetrics = (dists) => ({
      count: dists.length,
      families: new Set(dists.map((d) => d.family_id).filter(Boolean)).size,
      packages: dists.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0),
      compliance:
        dists.length > 0
          ? Math.round(
              (dists.filter((d) => String(d.status || '').toLowerCase() !== 'pending').length / dists.length) * 100,
            )
          : 0,
    })

    const thisMetrics = calcMetrics(distributions.filter((d) => inMonth(d, thisYear, thisMonthIdx)))
    const lastMetrics = calcMetrics(distributions.filter((d) => inMonth(d, lastYear, lastMonthIdx)))

    const pctChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 100)
    }

    const trendMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonthIdx - (5 - i), 1)
      return { label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
    })

    const trendCounts = trendMonths.map(({ year, month }) =>
      distributions.filter((d) => inMonth(d, year, month)).length,
    )
    const trendFamilies = trendMonths.map(({ year, month }) =>
      new Set(
        distributions.filter((d) => inMonth(d, year, month) && d.family_id).map((d) => d.family_id),
      ).size,
    )
    const trendPackages = trendMonths.map(({ year, month }) =>
      distributions.filter((d) => inMonth(d, year, month)).reduce((sum, d) => sum + (Number(d.quantity) || 0), 0),
    )
    const trendCompliance = trendMonths.map(({ year, month }) => {
      const dists = distributions.filter((d) => inMonth(d, year, month))
      if (dists.length === 0) return 0
      return Math.round(
        (dists.filter((d) => String(d.status || '').toLowerCase() !== 'pending').length / dists.length) * 100,
      )
    })

    const peakIdx = trendCounts.indexOf(Math.max(...trendCounts, 0))
    const peakMonth = trendMonths[peakIdx]?.label || '—'

    const trendMax = Math.max(...trendCounts, ...trendFamilies, 1)
    const trendYMax = trendMax <= 10 ? 10 : trendMax <= 100 ? Math.ceil(trendMax / 10) * 10 : Math.ceil(trendMax / 100) * 100

    return {
      thisMetrics,
      lastMetrics,
      pctChange,
      trendMonths: trendMonths.map((m) => m.label),
      trendCounts,
      trendFamilies,
      trendPackages,
      trendCompliance,
      trendYMax,
      peakMonth,
      topBarangay: barangayDistribution[0] || null,
      topFood: assistanceBreakdown[0] || null,
    }
  }, [distributions, barangayDistribution, assistanceBreakdown])

  const handleDownload = () => {
    const headers = ['ID', 'Recipient', 'Barangay', 'Item', 'Quantity', 'Status', 'Date Given']
    const rows = distributions.map((d) => [
      d.distribution_id,
      d.family_name || d.individual_name || 'Unknown',
      d.barangay_name || '',
      d.food_name || 'Food supply',
      d.quantity ? `${d.quantity} ${d.unit || ''}`.trim() : '',
      d.status || 'Pending',
      d.date_given ? new Date(d.date_given).toLocaleDateString('en-US') : '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `phams-transparency-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleViewAnalytics = () => {
    setShowAnalyticsModal(true)
  }

  const handleExportPDF = () => {
    const { thisMetrics, lastMetrics, pctChange, trendMonths, trendCounts, trendFamilies, peakMonth, topBarangay, topFood } = analyticsData

    // --- Interpretation logic ---
    const distChange = pctChange(thisMetrics.count, lastMetrics.count)
    const familyChange = pctChange(thisMetrics.families, lastMetrics.families)

    const execSummary = thisMetrics.count === 0
      ? 'No distribution activities have been recorded for the current reporting period. This may indicate that food distribution has not yet commenced for this month or that data entry is still pending. Previous month figures are available for reference.'
      : `For ${new Date().toLocaleString('en-PH', { month: 'long', year: 'numeric' })}, the program recorded ${thisMetrics.count} distribution event${thisMetrics.count !== 1 ? 's' : ''}, reaching ${thisMetrics.families} unique famil${thisMetrics.families !== 1 ? 'ies' : 'y'} with a total of ${thisMetrics.packages} package${thisMetrics.packages !== 1 ? 's' : ''} delivered. The overall compliance rate stands at ${thisMetrics.compliance}%. ${distChange > 5 ? 'Distribution activity is trending upward compared to last month, reflecting improved program reach.' : distChange < -5 ? 'A decline in distribution activity has been noted compared to last month, which warrants operational review.' : 'Distribution activity is relatively stable compared to the previous month.'}`

    const momText = (() => {
      const lines = []
      if (distChange > 0) lines.push(`Distribution events increased by ${distChange}% (from ${lastMetrics.count} to ${thisMetrics.count}), reflecting positive operational momentum.`)
      else if (distChange < 0) lines.push(`Distribution events decreased by ${Math.abs(distChange)}% (from ${lastMetrics.count} to ${thisMetrics.count}). This decline should be investigated to identify operational gaps.`)
      else lines.push(`Distribution events remained unchanged from the previous month at ${thisMetrics.count}.`)
      if (familyChange > 0) lines.push(`Families served grew by ${familyChange}%, indicating broader program coverage this month.`)
      else if (familyChange < 0) lines.push(`Fewer unique families were served compared to last month (${familyChange}% change). Coverage expansion should be prioritized.`)
      const complianceLevel = thisMetrics.compliance >= 80 ? 'satisfactory' : thisMetrics.compliance >= 60 ? 'moderate' : 'below target'
      lines.push(`The compliance rate of ${thisMetrics.compliance}% is ${complianceLevel}. ${thisMetrics.compliance >= 80 ? 'Most distributions have been completed as scheduled.' : 'Effort should be made to resolve pending distributions to bring compliance above 80%.'}`)
      return lines.join(' ')
    })()

    const trendAvg = trendCounts.reduce((a, b) => a + b, 0) / (trendCounts.length || 1)
    const recentAvg = trendCounts.slice(-2).reduce((a, b) => a + b, 0) / 2
    const trendDir = recentAvg > trendAvg * 1.1 ? 'upward' : recentAvg < trendAvg * 0.9 ? 'downward' : 'stable'
    const trendText = `Over the past six months, distribution activity shows a ${trendDir} trend. ${trendDir === 'upward' ? `Recent months demonstrate higher activity levels compared to the six-month average of ${Math.round(trendAvg)} distributions per month, suggesting program growth and improved community reach.` : trendDir === 'downward' ? `Recent months show activity below the six-month average of ${Math.round(trendAvg)} distributions per month. A root-cause analysis is recommended to address contributing factors.` : `Activity has remained consistent around the six-month average of ${Math.round(trendAvg)} distributions per month, indicating stable program operations.`} The peak month within this period was ${peakMonth}, which recorded the highest distribution volume.`

    const barangayText = barangayDistribution.length === 0
      ? 'No barangay distribution data is available for the current period.'
      : `${topBarangay ? `${topBarangay.barangay} is the leading barangay with ${topBarangay.families} families served, representing ${topBarangay.percentage}% of total distributions. ` : ''}Distribution coverage currently spans ${barangayDistribution.length} barangay${barangayDistribution.length !== 1 ? 's' : ''} in the system. ${barangayDistribution.length < 10 ? 'Not all 10 barangays of Pateros are represented in the current data. Outreach efforts should be expanded to ensure equitable food assistance coverage across all barangays.' : 'All barangays are represented, indicating full territorial coverage by the program.'}`

    const recs = []
    if (thisMetrics.compliance < 80) recs.push('Review and resolve pending distributions to raise the compliance rate above the 80% target threshold.')
    if (distChange < -10) recs.push('Investigate the significant drop in distribution activities. Identify operational, logistical, or data entry gaps and implement corrective measures.')
    if (trendDir === 'downward') recs.push('Develop an action plan to reverse the declining distribution trend. Consider increasing distribution frequency and expanding barangay coordination.')
    if (barangayDistribution.length < 10) recs.push('Expand distribution reach to cover all 10 barangays of Pateros. Ensure no household is excluded from the program.')
    if (familyChange < -10) recs.push('Address the decrease in families served. Identify unreached households and strengthen community outreach and registration efforts.')
    if (recs.length === 0) recs.push('Maintain current operational standards. Continue monitoring key indicators monthly to sustain program performance.')
    recs.push('Ensure all distribution records are entered into PHAMS promptly to maintain accurate real-time reporting.')
    recs.push('Conduct regular coordination meetings with barangay staff to align on distribution schedules and coverage targets.')

    const changeTag = (curr, prev) => {
      const pct = pctChange(curr, prev)
      if (pct > 0) return `<span style="color:#16a34a;font-weight:700">&#9650; +${pct}%</span>`
      if (pct < 0) return `<span style="color:#dc2626;font-weight:700">&#9660; ${pct}%</span>`
      return `<span style="color:#64748b;font-weight:700">&#8594; 0%</span>`
    }

    const reportDate = new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const reportMonth = new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long' })

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>PHAMS Analytics Report &mdash; ${reportMonth}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1e293b; font-size: 13px; line-height: 1.6; }
    .cover { background: linear-gradient(135deg, #0f2b5b 0%, #1a4a8a 100%); color: white; padding: 44px 48px 36px; }
    .cover-eyebrow { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #93c5fd; margin-bottom: 10px; }
    .cover-title { font-size: 26px; font-weight: 800; line-height: 1.2; margin-bottom: 6px; }
    .cover-sub { font-size: 13px; color: #bfdbfe; margin-bottom: 28px; }
    .cover-meta { display: flex; gap: 36px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 18px; }
    .cover-meta-item label { font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: #93c5fd; display: block; margin-bottom: 2px; }
    .cover-meta-item span { font-size: 12px; font-weight: 600; }
    .body { padding: 36px 48px; }
    .exec { background: #eff6ff; border-left: 4px solid #1d4ed8; border-radius: 0 8px 8px 0; padding: 14px 18px; font-size: 13px; color: #1e3a5f; line-height: 1.7; margin-bottom: 32px; }
    .section { margin-bottom: 32px; }
    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .section-num { background: #0f2b5b; color: white; font-size: 10px; font-weight: 800; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .section-title { font-size: 13px; font-weight: 700; color: #0f2b5b; text-transform: uppercase; letter-spacing: .06em; }
    .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
    .metric-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #fafbfc; }
    .metric-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 4px; }
    .metric-value { font-size: 22px; font-weight: 800; color: #0f172a; }
    .metric-change { font-size: 11px; color: #64748b; margin-top: 4px; }
    .interp { background: #f8fafc; border: 1px solid #e8edf2; border-radius: 6px; padding: 11px 14px; font-size: 12px; color: #475569; line-height: 1.75; margin-top: 10px; }
    .interp::before { content: "Analysis: "; font-weight: 700; color: #0f2b5b; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #0f2b5b; }
    th { text-align: left; padding: 9px 12px; color: white; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #f8fafc; }
    .bar-row { margin-bottom: 10px; }
    .bar-meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #334155; }
    .bar-bg { background: #e2e8f0; border-radius: 4px; height: 8px; }
    .bar-fill { background: #1d4ed8; border-radius: 4px; height: 8px; }
    .rec-box { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .rec-item { display: flex; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; align-items: flex-start; }
    .rec-item:last-child { border-bottom: none; }
    .rec-arrow { color: #1d4ed8; font-weight: 800; flex-shrink: 0; margin-top: 1px; }
    .footer { background: #f1f5f9; border-top: 2px solid #e2e8f0; padding: 14px 48px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
    .footer strong { color: #475569; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="cover">
    <div class="cover-eyebrow">Pateros Hunger Assistance Management System</div>
    <div class="cover-title">Analytics &amp; Distribution Report</div>
    <div class="cover-sub">Monthly Performance Summary &mdash; Municipality of Pateros</div>
    <div class="cover-meta">
      <div class="cover-meta-item"><label>Reporting Period</label><span>${reportMonth}</span></div>
      <div class="cover-meta-item"><label>Date Generated</label><span>${reportDate}</span></div>
      <div class="cover-meta-item"><label>Classification</label><span>Internal Use Only</span></div>
    </div>
  </div>

  <div class="body">
    <div class="exec">${execSummary}</div>

    <div class="section">
      <div class="section-header"><div class="section-num">1</div><div class="section-title">Distribution Performance &mdash; Month-over-Month</div></div>
      <div class="metric-grid">
        <div class="metric-card" style="border-left:3px solid #2563eb"><div class="metric-label">Distributions</div><div class="metric-value">${thisMetrics.count}</div><div class="metric-change">${changeTag(thisMetrics.count, lastMetrics.count)} vs ${lastMetrics.count} last mo.</div></div>
        <div class="metric-card" style="border-left:3px solid #ea580c"><div class="metric-label">Families Served</div><div class="metric-value">${thisMetrics.families}</div><div class="metric-change">${changeTag(thisMetrics.families, lastMetrics.families)} vs ${lastMetrics.families} last mo.</div></div>
        <div class="metric-card" style="border-left:3px solid #16a34a"><div class="metric-label">Packages Given</div><div class="metric-value">${thisMetrics.packages}</div><div class="metric-change">${changeTag(thisMetrics.packages, lastMetrics.packages)} vs ${lastMetrics.packages} last mo.</div></div>
        <div class="metric-card" style="border-left:3px solid #8b5cf6"><div class="metric-label">Compliance Rate</div><div class="metric-value">${thisMetrics.compliance}%</div><div class="metric-change">${changeTag(thisMetrics.compliance, lastMetrics.compliance)} vs ${lastMetrics.compliance}% last mo.</div></div>
      </div>
      <div class="interp">${momText}</div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-num">2</div><div class="section-title">6-Month Trend Analysis</div></div>
      <table>
        <thead><tr><th>Month</th><th>Distributions</th><th>Families Reached</th></tr></thead>
        <tbody>${trendMonths.map((month, i) => `<tr><td>${month}</td><td>${trendCounts[i]}</td><td>${trendFamilies[i]}</td></tr>`).join('')}</tbody>
      </table>
      <div class="interp">${trendText}</div>
    </div>

    ${barangayDistribution.length > 0 ? `
    <div class="section">
      <div class="section-header"><div class="section-num">3</div><div class="section-title">Barangay Coverage Analysis</div></div>
      ${barangayDistribution.slice(0, 5).map((item) => `
      <div class="bar-row">
        <div class="bar-meta"><span>${item.barangay}</span><span><strong>${item.families}</strong> families &bull; ${item.percentage}%</span></div>
        <div class="bar-bg"><div class="bar-fill" style="width:${item.percentage}%"></div></div>
      </div>`).join('')}
      <div class="interp">${barangayText}</div>
    </div>` : ''}

    <div class="section">
      <div class="section-header"><div class="section-num">${barangayDistribution.length > 0 ? '4' : '3'}</div><div class="section-title">Recommendations</div></div>
      <div class="rec-box">
        ${recs.map((rec) => `<div class="rec-item"><span class="rec-arrow">&#8594;</span><span>${rec}</span></div>`).join('')}
      </div>
    </div>
  </div>

  <div class="footer">
    <div><strong>PHAMS</strong> &mdash; Pateros Hunger Assistance Management System &mdash; Municipality of Pateros</div>
    <div>Confidential &bull; For Internal Use Only</div>
  </div>
  <script>window.onload = function () { window.print() }</script>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const openEditModal = (distribution) => {
    setEditingDistribution(distribution)
    setEditingStatus(distribution.status || 'Pending')
    setActionError('')
    setSuccessMessage('')
    document.body.style.overflow = 'hidden'
    
    // Scroll modal into current viewport
    setTimeout(() => {
      const modal = document.querySelector('[role="dialog"]')
      if (modal) {
        modal.scrollIntoView({ behavior: 'auto', block: 'center' })
      }
    }, 50)
  }

  const closeEditModal = () => {
    setEditingDistribution(null)
    document.body.style.overflow = 'unset'
  }

  const openProofModal = (distribution) => {
    setProofDistribution(distribution)
    document.body.style.overflow = 'hidden'
  }

  const closeProofModal = () => {
    setProofDistribution(null)
    document.body.style.overflow = 'unset'
  }

  const handleUpdateStatus = async (event) => {
    event.preventDefault()
    if (!editingDistribution) return

    setSavingStatus(true)
    setActionError('')
    setSuccessMessage('')
    try {
      const actor = getCurrentStaffActor()
      await apiFetch(`/api/distributions/${editingDistribution.distribution_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: editingStatus,
          ...actor,
        }),
      })

      setSuccessMessage('Distribution status updated.')
      closeEditModal()
      await loadTransparencyData()
    } catch (err) {
      setActionError(err.message || 'Failed to update distribution status.')
    } finally {
      setSavingStatus(false)
    }
  }

  const handleDeleteDistribution = async (distributionId) => {
    if (!confirm('Delete this distribution record? This cannot be undone.')) {
      return
    }

    setDeletingId(distributionId)
    setActionError('')
    setSuccessMessage('')
    try {
      const actor = getCurrentStaffActor()
      await apiFetch(`/api/distributions/${distributionId}`, {
        method: 'DELETE',
        body: JSON.stringify({ ...actor }),
      })
      setSuccessMessage('Distribution deleted.')
      await loadTransparencyData()
    } catch (err) {
      setActionError(err.message || 'Failed to delete distribution.')
    } finally {
      setDeletingId(null)
    }
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
        {loading && (
          <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading transparency data...
          </p>
        )}
        {error && (
          <p className="mt-2 text-xs text-red-500">Error: {error}</p>
        )}
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
            {summaryStats.totalAssistance}
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
            {summaryStats.familiesServed}
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
            {summaryStats.activeStaff}
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
            {summaryStats.complianceRate}%
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            Reports submitted on time
          </p>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {activity.action}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${activity.action === 'Deleted' ? 'bg-red-100 text-red-700' : activity.action === 'Updated' ? 'bg-amber-100 text-amber-700' : activity.action === 'Distributed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {activity.status}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {activity.details}
                    </p>
                    <div className={`mt-3 grid gap-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>Timestamp: {activity.timestamp}</span>
                      <span>Staff: {activity.staff}</span>
                    </div>
                  </div>
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

      {/* DISTRIBUTION LIST */}
      <div
        id="distribution-list-section"
        className={`rounded-2xl border p-6 mb-8 transition ${
          isDarkMode
            ? 'bg-[#111c2e] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Distribution Records
          </h4>
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {distributions.length} total
          </span>
        </div>

        {loading ? (
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading distributions...
          </p>
        ) : distributions.length === 0 ? (
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            No distributions recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wide ${
                  isDarkMode
                    ? 'border-white/10 text-slate-400'
                    : 'border-slate-200 text-slate-500'
                }`}>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Recipient</th>
                  <th className="px-4 py-3 text-left font-semibold">Image</th>
                  <th className="px-4 py-3 text-left font-semibold">Barangay</th>
                  <th className="px-4 py-3 text-left font-semibold">Item</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {distributions.map((distribution) => {
                  const recipient = distribution.family_name || distribution.individual_name || 'Unknown'
                  const itemName = distribution.food_name || 'Food supply'
                  const itemQty = distribution.quantity ? `${distribution.quantity} ${distribution.unit || ''}`.trim() : '—'
                  const displayStatus = getDistributionStatus(distribution)
                  return (
                    <tr
                      key={distribution.distribution_id}
                      className={`transition ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                    >
                      <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {distribution.distribution_id}
                      </td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {recipient}
                      </td>
                      <td className="px-4 py-3">
                        {distribution.image ? (
                          <img
                            src={`data:image/jpeg;base64,${distribution.image}`}
                            alt="Distribution photo"
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            —
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {distribution.barangay_name || '—'}
                      </td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {itemName} {itemQty !== '—' ? `(${itemQty})` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          displayStatus === 'Pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatDate(distribution.date_given)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {distribution.image ? (
                            <button
                              onClick={() => openProofModal(distribution)}
                              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                isDarkMode
                                  ? 'bg-blue-700/70 text-blue-100 hover:bg-blue-700'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              View Proof
                            </button>
                          ) : (
                            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              No Proof
                            </span>
                          )}
                          <button
                            onClick={() => openEditModal(distribution)}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              isDarkMode
                                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDistribution(distribution.distribution_id)}
                            disabled={deletingId === distribution.distribution_id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            {deletingId === distribution.distribution_id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
          <button
            onClick={handleViewAnalytics}
            className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white py-2.5 px-4 rounded-lg font-medium transition"
          >
            <span>📊</span>
            View Analytics
          </button>
          <button
            onClick={loadTransparencyData}
            disabled={loading}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-lg font-medium transition disabled:opacity-60 ${
              isDarkMode
                ? 'border border-slate-600 text-slate-200 hover:bg-slate-800'
                : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{loading ? '⏳' : '🔄'}</span>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {editingDistribution ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" className={`w-full max-w-lg rounded-2xl border p-6 shadow-xl ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Update Distribution Status</h3>
              <button
                onClick={closeEditModal}
                className={`text-xs font-semibold px-3 py-1 rounded ${
                  isDarkMode
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Status
                </label>
                <select
                  value={editingStatus}
                  onChange={(event) => setEditingStatus(event.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-900 text-slate-100'
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isDarkMode
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
                >
                  {savingStatus ? 'Saving...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {proofDistribution ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            className={`w-full max-w-3xl rounded-2xl border p-4 shadow-xl ${
              isDarkMode
                ? 'bg-[#111c2e] border-white/10 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Proof Image</h3>
              <button
                onClick={closeProofModal}
                className={`text-xs font-semibold px-3 py-1 rounded ${
                  isDarkMode
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Close
              </button>
            </div>
            <div className="flex items-center justify-center">
              <img
                src={`data:image/jpeg;base64,${proofDistribution.image}`}
                alt="Distribution proof"
                className="max-h-[75vh] w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      {showAnalyticsModal ? createPortal(
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-64 z-30 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.5)' }}>
          <div className={`w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden max-h-[90vh] ${isDarkMode ? 'bg-[#0d1526] shadow-[0_8px_40px_rgba(0,0,0,0.6)]' : 'bg-white shadow-[0_8px_40px_rgba(0,0,0,0.2)]'}`}>

            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-5 ${isDarkMode ? 'border-b border-white/10' : 'border-b border-slate-100'}`}>
              <div>
                <h3 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Analytics Overview</h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date().toLocaleString('en-PH', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  isDarkMode ? 'bg-slate-700/60 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

              {/* Month-over-Month */}
              <section>
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Month-over-Month</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Distributions', curr: analyticsData.thisMetrics.count, prev: analyticsData.lastMetrics.count, sparkData: analyticsData.trendCounts, color: '#2563eb' },
                    { label: 'Families Served', curr: analyticsData.thisMetrics.families, prev: analyticsData.lastMetrics.families, sparkData: analyticsData.trendFamilies, color: '#ea580c' },
                    { label: 'Packages Given', curr: analyticsData.thisMetrics.packages, prev: analyticsData.lastMetrics.packages, sparkData: analyticsData.trendPackages, color: '#16a34a' },
                    { label: 'Compliance Rate', curr: analyticsData.thisMetrics.compliance, prev: analyticsData.lastMetrics.compliance, sparkData: analyticsData.trendCompliance, color: '#8b5cf6', suffix: '%' },
                  ].map(({ label, curr, prev, sparkData, color, suffix = '' }) => {
                    const pct = analyticsData.pctChange(curr, prev)
                    const isUp = pct > 0
                    const isDown = pct < 0
                    return (
                      <div
                        key={label}
                        className={`rounded-xl border p-4 ${isDarkMode ? 'border-slate-700/80 bg-slate-800/30' : 'border-slate-200 bg-white shadow-sm'}`}
                        style={{ borderLeftWidth: '3px', borderLeftColor: color }}
                      >
                        <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                        <div className="flex items-end justify-between mt-2">
                          <p className={`text-3xl font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{curr}{suffix}</p>
                          <Sparkline data={sparkData} color={color} />
                        </div>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full border ${
                            isUp ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            isDown ? 'bg-red-50 text-red-600 border-red-200' :
                            isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {isUp ? `▲ +${pct}%` : isDown ? `▼ ${pct}%` : '→ 0%'}
                          </span>
                          <span className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>vs {prev}{suffix} last mo.</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <div className={`border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`} />

              {/* 6-Month Trend */}
              <section>
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>6-Month Trend</p>
                <svg viewBox="0 0 480 150" className="w-full h-auto" role="img" aria-label="6-month distribution trend chart">
                  {[15, 42.5, 70, 97.5, 125].map((y) => (
                    <line key={y} x1="40" y1={y} x2="470" y2={y} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} strokeWidth="1" />
                  ))}
                  <line x1="40" y1="15" x2="40" y2="125" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                  <line x1="40" y1="125" x2="470" y2="125" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                  {[1, 0.75, 0.5, 0.25, 0].map((ratio, i) => (
                    <text key={ratio} x="35" y={15 + i * 27.5 + 4} textAnchor="end" fontSize="10" fill={isDarkMode ? '#475569' : '#94a3b8'}>
                      {Math.round(analyticsData.trendYMax * ratio)}
                    </text>
                  ))}
                  {analyticsData.trendMonths.map((month, i) => (
                    <text key={month} x={40 + i * 86} y="142" textAnchor="middle" fontSize="10" fill={isDarkMode ? '#475569' : '#94a3b8'}>
                      {month}
                    </text>
                  ))}
                  <polygon
                    points={[
                      ...analyticsData.trendCounts.map((v, i) => `${40 + i * 86},${125 - (v / analyticsData.trendYMax) * 110}`),
                      `${40 + 5 * 86},125`, `40,125`,
                    ].join(' ')}
                    fill="#2563eb" opacity="0.07"
                  />
                  <polyline fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    points={analyticsData.trendCounts.map((v, i) => `${40 + i * 86},${125 - (v / analyticsData.trendYMax) * 110}`).join(' ')}
                  />
                  <polyline fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    points={analyticsData.trendFamilies.map((v, i) => `${40 + i * 86},${125 - (v / analyticsData.trendYMax) * 110}`).join(' ')}
                  />
                  {analyticsData.trendCounts.map((v, i) => (
                    <circle key={`dc-${i}`} cx={40 + i * 86} cy={125 - (v / analyticsData.trendYMax) * 110} r="3" fill={isDarkMode ? '#0d1526' : '#fff'} stroke="#2563eb" strokeWidth="2" />
                  ))}
                  {analyticsData.trendFamilies.map((v, i) => (
                    <circle key={`fc-${i}`} cx={40 + i * 86} cy={125 - (v / analyticsData.trendYMax) * 110} r="3" fill={isDarkMode ? '#0d1526' : '#fff'} stroke="#ea580c" strokeWidth="2" />
                  ))}
                </svg>
                <div className="flex items-center justify-center gap-6 mt-3 text-xs font-medium">
                  <span className="flex items-center gap-2 text-blue-600">
                    <span className="inline-block h-0.5 w-6 rounded-full bg-blue-600" />Distributions
                  </span>
                  <span className="flex items-center gap-2 text-orange-600">
                    <span className="inline-block h-0.5 w-6 rounded-full bg-orange-600" />Families Reached
                  </span>
                </div>
              </section>

              {barangayDistribution.length > 0 && (
                <>
                  <div className={`border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`} />
                  <section>
                    <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Top Barangays</p>
                    <div className="space-y-3">
                      {barangayDistribution.slice(0, 5).map((item) => (
                        <div key={item.barangay}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.barangay}</span>
                            <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.families} families · {item.percentage}%</span>
                          </div>
                          <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              <div className={`border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`} />

              {/* Quick Insights */}
              <section>
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Quick Insights</p>
                <div className="space-y-2">
                  {[
                    analyticsData.topBarangay && {
                      icon: '📍',
                      label: 'Most active barangay',
                      value: `${analyticsData.topBarangay.barangay}`,
                      sub: `${analyticsData.topBarangay.families} families · ${analyticsData.topBarangay.percentage}%`,
                    },
                    analyticsData.topFood && {
                      icon: '🍚',
                      label: 'Most distributed item',
                      value: `${analyticsData.topFood.category}`,
                      sub: `${analyticsData.topFood.count} units · ${analyticsData.topFood.percentage}%`,
                    },
                    {
                      icon: '📅',
                      label: 'Peak month (last 6 months)',
                      value: analyticsData.peakMonth,
                      sub: 'Highest distribution volume',
                    },
                  ].filter(Boolean).map((item, i) => (
                    <div key={i} className={`flex items-center gap-4 px-4 py-3 rounded-xl ${isDarkMode ? 'bg-slate-800/40 border border-slate-700/50' : 'border border-slate-100 bg-slate-50/50'}`}>
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                        <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
                        <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Export */}
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 font-semibold text-sm transition shadow-sm mb-1"
              >
                <Download size={15} />
                Export to PDF
              </button>

            </div>
          </div>
        </div>
      , document.body) : null}
    </div>
  )
}
