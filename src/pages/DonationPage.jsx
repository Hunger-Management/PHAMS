import { useEffect, useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import Footer from '../components/Footer'
import SiteHeader from '../components/SiteHeader'
import { apiFetch } from '../api/api'
import bankTransferQr from '../assets/Bank.webp'
import gcashQr from '../assets/Gcash.png'

const donationChannels = [
  {
    id: 'monetary',
    title: 'Monetary Donation',
    details: 'Cash or bank transfer to support food assistance programs',
    icon: '💳',
    iconClass: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
  {
    id: 'food',
    title: 'Food Donation',
    details: 'Rice, canned goods, vegetables, and other food items',
    icon: '🍴',
    iconClass: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
  },
  {
    id: 'supplies',
    title: 'Supplies Donation',
    details: 'Cooking equipment, storage containers, and distribution materials',
    icon: '📦',
    iconClass: 'text-amber-600',
    iconBg: 'bg-amber-100',
  },
]

function DonationPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [processedBankQr, setProcessedBankQr] = useState(null)
  const [selectedChannel, setSelectedChannel] = useState('monetary')
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
  const [selectedAmount, setSelectedAmount] = useState(500)
  const [customAmount, setCustomAmount] = useState('')
  const [barangays, setBarangays] = useState([])
  const [monetaryBarangayId, setMonetaryBarangayId] = useState('')
  const [monetaryForm, setMonetaryForm] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    message: '',
  })
  const [monetarySubmitting, setMonetarySubmitting] = useState(false)
  const [monetarySuccess, setMonetarySuccess] = useState('')
  const [monetaryError, setMonetaryError] = useState('')
  const [monetaryImageFile, setMonetaryImageFile] = useState(null)
  const [monetaryImagePreview, setMonetaryImagePreview] = useState('')
  const [recentDonors, setRecentDonors] = useState([])
  const [showAllDonors, setShowAllDonors] = useState(false)
  const [donorError, setDonorError] = useState('')
  const [foodSupplies, setFoodSupplies] = useState([])
  const [foodSuppliesError, setFoodSuppliesError] = useState('')
  const [foodSubmitting, setFoodSubmitting] = useState(false)
  const [foodSuccess, setFoodSuccess] = useState('')
  const [foodError, setFoodError] = useState('')
  const [foodImageFile, setFoodImageFile] = useState(null)
  const [foodForm, setFoodForm] = useState({
    foodId: '',
    foodDescription: '',
    quantity: '',
    quantityUnit: 'Kilo',
    donorName: '',
    contactInfo: '',
    dateGiven: '',
    barangayId: '',
    deliveryMethod: 'I will drop off at the municipal office',
    pickupAddress: '',
  })
  const [suppliesSubmitting, setSuppliesSubmitting] = useState(false)
  const [suppliesSuccess, setSuppliesSuccess] = useState('')
  const [suppliesError, setSuppliesError] = useState('')
  const [suppliesImageFile, setSuppliesImageFile] = useState(null)
  const [suppliesForm, setSuppliesForm] = useState({
    foodId: '',
    foodDescription: '',
    quantity: '',
    donorName: '',
    contactInfo: '',
    dateGiven: '',
    barangayId: '',
    condition: 'Brand New',
    notes: '',
  })

  const donationAmounts = [500, 1000, 2500, 5000, 10000]
  const resolvedAmount = Number(customAmount) > 0 ? Number(customAmount) : selectedAmount

  function formatPhpAmount(amount) {
    return new Intl.NumberFormat('en-PH').format(amount)
  }

  const formatDonationDate = (value) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'Recently'
    return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Crop the image to the QR area (detect dark pixels bounding box)
  async function cropToQr(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const d = imageData.data

          let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0
          const threshold = 200 // luminance threshold to detect dark modules

          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4
              const r = d[i], g = d[i + 1], b = d[i + 2]
              const lum = 0.299 * r + 0.587 * g + 0.114 * b
              if (lum < threshold) {
                if (x < minX) minX = x
                if (y < minY) minY = y
                if (x > maxX) maxX = x
                if (y > maxY) maxY = y
              }
            }
          }

          if (maxX <= minX || maxY <= minY) {
            // no dark area detected — fallback
            resolve(src)
            return
          }

          // add small padding
          const pad = Math.round(Math.min(canvas.width, canvas.height) * 0.03)
          minX = Math.max(0, minX - pad)
          minY = Math.max(0, minY - pad)
          maxX = Math.min(canvas.width - 1, maxX + pad)
          maxY = Math.min(canvas.height - 1, maxY + pad)

          const w = maxX - minX + 1
          const h = maxY - minY + 1
          const out = document.createElement('canvas')
          out.width = w
          out.height = h
          const outCtx = out.getContext('2d')
          outCtx.drawImage(canvas, minX, minY, w, h, 0, 0, w, h)
          resolve(out.toDataURL('image/png'))
        } catch (err) {
          resolve(src)
        }
      }
      img.onerror = () => resolve(src)
      img.src = src
    })
  }

  useEffect(() => {
    let mounted = true
    cropToQr(bankTransferQr).then((dataUrl) => {
      if (mounted) setProcessedBankQr(dataUrl)
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!monetaryImageFile) {
      setMonetaryImagePreview('')
      return undefined
    }

    const previewUrl = URL.createObjectURL(monetaryImageFile)
    setMonetaryImagePreview(previewUrl)

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [monetaryImageFile])

  const bankTransferCard = processedBankQr ? (
    <div className="mt-6 flex justify-center">
      <img
        src={processedBankQr}
        alt="BPI InstaPay QR code"
        className="h-80 w-80 object-contain md:h-96 md:w-96"
      />
    </div>
  ) : (
    <div className={`mt-6 rounded-2xl border p-5 md:p-6 ${isDarkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-center">
        <div className="w-full max-w-[720px] rounded-[28px] bg-[#d84343] p-5 shadow-lg">
          <div className="rounded-[24px] bg-white px-6 py-8 text-center">
            <p className="text-4xl font-black tracking-tight text-[#ef4d4a] md:text-5xl">BPI</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-800 md:text-[2.35rem]">SS BPI</p>
            <p className="mt-4 text-lg text-slate-700 md:text-xl">Account number: xxxxxx316</p>

            <div className="mx-auto mt-10 flex justify-center">
              <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
                <img
                  src={bankTransferQr}
                  alt="BPI InstaPay QR code"
                  className="h-80 w-80 rounded-xl object-contain md:h-96 md:w-96"
                />
              </div>
            </div>

            <p className="mt-10 text-base text-slate-500 md:text-lg">Transfer fees may apply</p>
          </div>
        </div>
      </div>
    </div>
  )

  const loadRecentDonors = () => {
    apiFetch('/api/donations')
      .then((data) => {
        const list = (Array.isArray(data) ? data : []).filter((item) => (item.status || 'approved') === 'approved')
        const mapped = list.map((item, index) => {
          const isMonetary = !item.food_id || Number(item.food_id) === 0
          return {
            name: item.donor_name || 'Anonymous',
            type: isMonetary ? 'Donation' : `Donation: ${item.food_name || 'Unknown food'}`,
            amount: isMonetary
              ? (item.quantity ? `₱${formatPhpAmount(Number(item.quantity))}` : '—')
              : (item.quantity ? `${item.quantity} ${item.quantity_unit || item.unit || ''}`.trim() : '—'),
            when: formatDonationDate(item.date_given),
            id: item.donation_id || `${item.donor_name || 'donor'}-${index}`,
            image: item.image || null,
          }
        })
        setRecentDonors(mapped)
        setDonorError('')
      })
      .catch((err) => {
        setDonorError(err.message || 'Unable to load donors.')
        setRecentDonors([])
      })
  }

  const loadFoodSupplies = () => {
    apiFetch('/api/food-supplies')
      .then((data) => {
        setFoodSupplies(Array.isArray(data) ? data : [])
        setFoodSuppliesError('')
      })
      .catch((err) => {
        setFoodSupplies([])
        setFoodSuppliesError(err.message || 'Unable to load food supplies.')
      })
  }

  useEffect(() => {
    loadRecentDonors()
    loadFoodSupplies()
    apiFetch('/api/barangays')
      .then((data) => setBarangays(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const handleFoodChange = (event) => {
    const { name, value } = event.target

    // Special handling for the food name input (datalist) — allow typing or selecting
    if (name === 'foodName') {
      const match = foodSupplies.find((f) => String(f.food_name) === String(value))
      if (match) {
        setFoodForm((prev) => ({ ...prev, foodId: match.food_id, foodDescription: '' }))
      } else {
        setFoodForm((prev) => ({ ...prev, foodId: '', foodDescription: value }))
      }
      return
    }

    setFoodForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSuppliesChange = (event) => {
    const { name, value } = event.target

    if (name === 'foodName') {
      const match = foodSupplies.find((f) => String(f.food_name) === String(value))
      if (match) {
        setSuppliesForm((prev) => ({ ...prev, foodId: match.food_id, foodDescription: '' }))
      } else {
        setSuppliesForm((prev) => ({ ...prev, foodId: '', foodDescription: value }))
      }
      return
    }

    setSuppliesForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleMonetaryChange = (event) => {
    const { name, value } = event.target
    setMonetaryForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleMonetarySubmit = async (event) => {
    event.preventDefault()
    setMonetarySuccess('')
    setMonetaryError('')

    if (!monetaryForm.fullName.trim()) {
      setMonetaryError('Please provide your full name before submitting.')
      return
    }

    if (!resolvedAmount || Number.isNaN(resolvedAmount) || resolvedAmount <= 0) {
      setMonetaryError('Please enter a valid donation amount.')
      return
    }

    // Require proof image for monetary donations
    if (!monetaryImageFile) {
      setMonetaryError('Please upload a proof of transaction (photo) for monetary donations.')
      return
    }

    setMonetarySubmitting(true)

    try {
      const donor = await apiFetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: monetaryForm.fullName.trim(),
          email: monetaryForm.email.trim() || null,
          phone: monetaryForm.contactNumber.trim() || null,
          contact_info: [monetaryForm.contactNumber.trim(), monetaryForm.email.trim()].filter(Boolean).join(' / ') || 'N/A',
        }),
      })

      const donationPayload = new FormData()
      donationPayload.append('donor_id', String(donor.donor_id))
      donationPayload.append('donation_type', 'monetary')
      donationPayload.append('quantity', String(resolvedAmount))
      donationPayload.append('quantity_unit', 'PHP')
      donationPayload.append('date_given', new Date().toISOString().split('T')[0])
      if (monetaryBarangayId) {
        donationPayload.append('barangay_id', String(Number(monetaryBarangayId)))
      }
      if (monetaryImageFile) {
        donationPayload.append('image', monetaryImageFile)
      }

      const result = await apiFetch('/api/donations', { method: 'POST', body: donationPayload })

      const trackingMsg = result?.tracking_number ? ` Your tracking number is ${result.tracking_number}.` : ''
      setMonetarySuccess(`Thank you! Your donation has been recorded and is pending review.${trackingMsg}`)
      setMonetaryForm({ fullName: '', email: '', contactNumber: '', message: '' })
      setMonetaryBarangayId('')
      setCustomAmount('')
      setSelectedAmount(500)
      setMonetaryImageFile(null)
      loadRecentDonors()
    } catch (err) {
      setMonetaryError(err.message || 'Unable to record donation right now.')
    } finally {
      setMonetarySubmitting(false)
    }
  }

  const handleFoodSubmit = async (event) => {
    event.preventDefault()
    setFoodSuccess('')
    setFoodError('')

    if (!foodForm.donorName || !foodForm.contactInfo || (!foodForm.foodId && !foodForm.foodDescription) || !foodForm.quantity || !foodForm.dateGiven) {
      setFoodError('Please complete all required fields (Name, Contact, Food item, Quantity, Date).')
      return
    }

    setFoodSubmitting(true)

    try {
      const donor = await apiFetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donor_name: foodForm.donorName, contact_info: foodForm.contactInfo }),
      })

      const donationPayload = new FormData()
      donationPayload.append('donor_id', String(donor.donor_id))
      donationPayload.append('donation_type', 'food')
      if (foodForm.foodId) {
        donationPayload.append('food_id', String(Number(foodForm.foodId)))
        donationPayload.append('food_description', '')
      } else {
        donationPayload.append('food_id', '')
        donationPayload.append('food_description', foodForm.foodDescription || '')
      }
      donationPayload.append('quantity', String(Number(foodForm.quantity)))
      donationPayload.append('quantity_unit', foodForm.quantityUnit)
      donationPayload.append('date_given', foodForm.dateGiven)
      if (foodForm.barangayId) {
        donationPayload.append('barangay_id', String(Number(foodForm.barangayId)))
      }
      if (foodImageFile) {
        donationPayload.append('image', foodImageFile)
      }

      const result = await apiFetch('/api/donations', { method: 'POST', body: donationPayload })

      const trackingMsg = result?.tracking_number ? ` Your tracking number is ${result.tracking_number}.` : ''
      setFoodSuccess(`Thank you! Your food donation has been recorded and is pending review.${trackingMsg}`)
      setFoodForm({
        foodId: '',
        foodDescription: '',
        quantity: '',
        quantityUnit: 'Kilo',
        donorName: '',
        contactInfo: '',
        dateGiven: '',
        barangayId: '',
        deliveryMethod: 'I will drop off at the municipal office',
        pickupAddress: '',
      })
      setFoodImageFile(null)
      loadRecentDonors()
      loadFoodSupplies()
    } catch (err) {
      setFoodError(err.message || 'Unable to record donation right now.')
    } finally {
      setFoodSubmitting(false)
    }
  }

  const handleSuppliesSubmit = async (event) => {
    event.preventDefault()
    setSuppliesSuccess('')
    setSuppliesError('')

    if (!suppliesForm.donorName || !suppliesForm.contactInfo || (!suppliesForm.foodId && !suppliesForm.foodDescription) || !suppliesForm.quantity || !suppliesForm.dateGiven) {
      setSuppliesError('Please complete all required fields (Name, Contact, Item, Quantity, Date).')
      return
    }

    setSuppliesSubmitting(true)

    try {
      const donor = await apiFetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donor_name: suppliesForm.donorName, contact_info: suppliesForm.contactInfo }),
      })

      const donationPayload = new FormData()
      donationPayload.append('donor_id', String(donor.donor_id))
      donationPayload.append('donation_type', 'equipment')
      if (suppliesForm.foodId) {
        donationPayload.append('food_id', String(Number(suppliesForm.foodId)))
        donationPayload.append('food_description', '')
      } else {
        donationPayload.append('food_id', '')
        donationPayload.append('food_description', suppliesForm.foodDescription || '')
      }
      donationPayload.append('quantity', String(suppliesForm.quantity))
      donationPayload.append('date_given', suppliesForm.dateGiven)
      if (suppliesForm.barangayId) {
        donationPayload.append('barangay_id', String(Number(suppliesForm.barangayId)))
      }
      if (suppliesImageFile) {
        donationPayload.append('image', suppliesImageFile)
      }

      const result = await apiFetch('/api/donations', { method: 'POST', body: donationPayload })

      const trackingMsg = result?.tracking_number ? ` Your tracking number is ${result.tracking_number}.` : ''
      setSuppliesSuccess(`Thank you! Your supplies donation has been recorded and is pending review.${trackingMsg}`)
      setSuppliesForm({
        foodId: '',
        foodDescription: '',
        quantity: '',
        donorName: '',
        contactInfo: '',
        dateGiven: '',
        barangayId: '',
        condition: 'Brand New',
        notes: '',
      })
      setSuppliesImageFile(null)
      loadRecentDonors()
      loadFoodSupplies()
    } catch (err) {
      setSuppliesError(err.message || 'Unable to record donation right now.')
    } finally {
      setSuppliesSubmitting(false)
    }
  }

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#dde5ea] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <section className="mx-auto w-[98%] max-w-[1600px] py-4 md:py-5 font-body">
        <datalist id="food-options">
          {foodSupplies.map((item) => (
            <option key={item.food_id} value={item.food_name} />
          ))}
        </datalist>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {donationChannels.map((channel) => (
            <button
              type="button"
              onClick={() => setSelectedChannel(channel.id)}
              key={channel.title}
              className={`rounded-2xl border p-8 shadow-sm transition-colors text-left ${
                selectedChannel === channel.id
                  ? isDarkMode
                    ? 'border-blue-400 ring-1 ring-blue-400 bg-slate-800'
                    : 'border-blue-700 ring-1 ring-blue-700 bg-[#f4f6f8]'
                  : isDarkMode
                    ? 'border-slate-700 bg-slate-800'
                    : 'border-slate-300 bg-[#f4f6f8]'
              }`}
            >
              <div className={`h-14 w-14 rounded-xl grid place-items-center text-2xl ${isDarkMode ? 'bg-slate-700 text-slate-100' : `${channel.iconBg} ${channel.iconClass}`}`}>
                {channel.icon}
              </div>
              <h3 className={`font-display mt-6 text-xl md:text-2xl leading-tight font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#071a2f]'}`}>
                {channel.title}
              </h3>
              <p className={`mt-3 text-base md:text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {channel.details}
              </p>

              {selectedChannel === channel.id ? (
                <span
                  className={`mt-5 inline-block rounded-md px-3 py-1 text-xs md:text-sm font-semibold tracking-wide ${
                    isDarkMode ? 'bg-blue-500 text-white' : 'bg-blue-700 text-white'
                  }`}
                >
                  Selected
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className={`mt-8 rounded-xl border p-1 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-[#cfd9de]'}`}>
          <div className="grid grid-cols-3 text-center">
            <button
              type="button"
              onClick={() => setSelectedChannel('monetary')}
              className={`rounded-md py-2 text-sm md:text-base font-semibold transition-colors ${
                selectedChannel === 'monetary'
                  ? isDarkMode
                    ? 'bg-slate-700 text-white'
                    : 'bg-[#dde5ea] text-slate-900'
                  : isDarkMode
                    ? 'text-slate-300'
                    : 'text-slate-900'
              }`}
            >
              Monetary
            </button>
            <button
              type="button"
              onClick={() => setSelectedChannel('food')}
              className={`rounded-md py-2 text-sm md:text-base font-semibold transition-colors ${
                selectedChannel === 'food'
                  ? isDarkMode
                    ? 'bg-slate-700 text-white'
                    : 'bg-[#dde5ea] text-slate-900'
                  : isDarkMode
                    ? 'text-slate-300'
                    : 'text-slate-900'
              }`}
            >
              Food
            </button>
            <button
              type="button"
              onClick={() => setSelectedChannel('supplies')}
              className={`rounded-md py-2 text-sm md:text-base font-semibold transition-colors ${
                selectedChannel === 'supplies'
                  ? isDarkMode
                    ? 'bg-slate-700 text-white'
                    : 'bg-[#dde5ea] text-slate-900'
                  : isDarkMode
                    ? 'text-slate-300'
                    : 'text-slate-900'
              }`}
            >
              Supplies
            </button>
          </div>
        </div>

        {selectedChannel === 'monetary' ? (
          <article className={`mt-6 rounded-xl border p-5 md:p-7 ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-[#f3f6f8]'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-lg ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>▭</span>
              <h2 className={`font-display text-xl md:text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#071a2f]'}`}>
                Monetary Donation
              </h2>
            </div>
            <p className={`mt-2 text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Choose an amount or enter a custom amount to donate
            </p>

            {monetarySuccess && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {monetarySuccess}
              </div>
            )}
            {monetaryError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {monetaryError}
              </div>
            )}

            <div className="mt-7">
              <h3 className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Select Amount (PHP)</h3>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                {donationAmounts.map((amount) => {
                  const isSelected = Number(customAmount || 0) === amount || (selectedAmount === amount && customAmount === '')

                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount)
                        setCustomAmount(String(amount))
                        // focus the custom amount input (best-effort)
                        const el = document.getElementById('custom-amount')
                        if (el) el.focus()
                      }}
                      className={`rounded-lg border px-4 py-2 text-lg font-semibold transition-colors ${
                        isSelected
                          ? 'bg-blue-700 border-blue-700 text-white'
                          : isDarkMode
                            ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                            : 'border-slate-300 bg-[#dce3e8] text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {formatPhpAmount(amount)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label htmlFor="custom-amount" className={`text-base md:text-lg font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                Or enter custom:
              </label>
              <input
                id="custom-amount"
                type="number"
                min="1"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                placeholder="Enter amount"
                className={`w-full max-w-xs rounded-lg border px-4 py-2 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  isDarkMode
                    ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                    : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>

            <form className="mt-7 space-y-4" onSubmit={handleMonetarySubmit}>
              <div>
                <label htmlFor="monetary-barangay" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Donate to Barangay (Optional)
                </label>
                <select
                  id="monetary-barangay"
                  value={monetaryBarangayId}
                  onChange={(event) => setMonetaryBarangayId(event.target.value)}
                  className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                  }`}
                >
                  <option value="">No preference (municipality decides)</option>
                  {barangays.map((b) => (
                    <option key={b.barangay_id} value={b.barangay_id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full-name" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    name="fullName"
                    value={monetaryForm.fullName}
                    onChange={handleMonetaryChange}
                    placeholder="Juan Dela Cruz"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="email-address" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Email Address
                  </label>
                  <input
                    id="email-address"
                    type="email"
                    name="email"
                    value={monetaryForm.email}
                    onChange={handleMonetaryChange}
                    placeholder="juan@example.com"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="contact-number" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Contact Number
                  </label>
                  <input
                    id="contact-number"
                    type="text"
                    name="contactNumber"
                    value={monetaryForm.contactNumber}
                    onChange={handleMonetaryChange}
                    placeholder="09XX XXX XXXX"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="payment-method" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Payment Method
                  </label>
                  <select
                    id="payment-method"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                    }`}
                  >
                    <option>Bank Transfer</option>
                    <option>GCash</option>
                  </select>
                </div>
              </div>

              {paymentMethod === 'Bank Transfer' ? bankTransferCard : paymentMethod === 'GCash' ? (
                <div className="mt-6 flex justify-center">
                  <img src={gcashQr} alt="GCash QR" className="h-80 w-80 object-contain md:h-96 md:w-96" />
                </div>
              ) : null}

              <div>
                <label htmlFor="donation-message" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Message (Optional)
                </label>
                <textarea
                  id="donation-message"
                  rows="3"
                  name="message"
                  value={monetaryForm.message}
                  onChange={handleMonetaryChange}
                  placeholder="Any message or dedication for your donation..."
                  className={`w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="proof-image" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Upload Proof of Transaction (required)
                </label>
                <input
                  id="proof-image"
                  type="file"
                  accept="image/*"
                    onChange={(event) => setMonetaryImageFile(event.target.files?.[0] || null)}
                    required
                  className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                  }`}
                />
                {monetaryImagePreview ? (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={monetaryImagePreview}
                      alt="Proof preview"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Preview of the selected image.
                    </span>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={monetarySubmitting}
                className="mt-2 w-full rounded-lg bg-blue-700 px-5 py-3 text-base md:text-lg font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
              >
                {monetarySubmitting ? 'Submitting...' : `♡ Donate PHP ${formatPhpAmount(resolvedAmount)}`}
              </button>
            </form>
          </article>
        ) : null}

        {selectedChannel === 'food' ? (
          <article className={`mt-6 rounded-xl border p-5 md:p-7 ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-[#f3f6f8]'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-lg ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>🍴</span>
              <h2 className={`font-display text-xl md:text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#071a2f]'}`}>
                Food Donation
              </h2>
            </div>
            <p className={`mt-2 text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Donate rice, canned goods, vegetables, or other food items
            </p>

            {foodSuccess && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {foodSuccess}
              </div>
            )}
            {foodError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {foodError}
              </div>
            )}
            {foodSuppliesError && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {foodSuppliesError}
              </div>
            )}

            <form className="mt-7 space-y-4" onSubmit={handleFoodSubmit}>
              <div>
                <label htmlFor="food-barangay" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Donate to Barangay (Optional)
                </label>
                <select
                  id="food-barangay"
                  name="barangayId"
                  value={foodForm.barangayId}
                  onChange={handleFoodChange}
                  className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                  }`}
                >
                  <option value="">No preference (municipality decides)</option>
                  {barangays.map((b) => (
                    <option key={b.barangay_id} value={b.barangay_id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="food-type" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Type of Food
                  </label>
                  <input
                    id="food-type"
                    name="foodName"
                    list="food-options"
                    value={foodForm.foodId ? (foodSupplies.find((f) => Number(f.food_id) === Number(foodForm.foodId))?.food_name || '') : foodForm.foodDescription}
                    onChange={handleFoodChange}
                    placeholder="Select or type food type"
                    className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                    }`}
                  />
                  <datalist id="food-options">
                    {foodSupplies.map((item) => (
                      <option key={item.food_id} value={item.food_name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="food-description" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Food Description
                  </label>
                  <input
                    id="food-description"
                    name="foodDescription"
                    type="text"
                    value={foodForm.foodDescription}
                    onChange={handleFoodChange}
                    readOnly={Boolean(foodForm.foodId)}
                    disabled={Boolean(foodForm.foodId)}
                    placeholder="Type the specific food item"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400 disabled:cursor-not-allowed disabled:opacity-60'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500 disabled:cursor-not-allowed disabled:opacity-60'
                    }`}
                  />
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {foodForm.foodId ? 'Dropdown selected. Manual typing is disabled.' : 'You can type a specific food item here if needed.'}
                  </p>
                </div>
                <div>
                  <label htmlFor="estimated-quantity" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Estimated Quantity
                  </label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
                    <input
                      id="estimated-quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={foodForm.quantity}
                      onChange={handleFoodChange}
                      placeholder="Enter amount"
                      className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        isDarkMode
                          ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                          : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                      }`}
                    />
                    <select
                      id="estimated-quantity-unit"
                      name="quantityUnit"
                      value={foodForm.quantityUnit}
                      onChange={handleFoodChange}
                      className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        isDarkMode
                          ? 'border-slate-600 bg-slate-800 text-slate-100'
                          : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                      }`}
                    >
                      <option value="Kilo">Kilo</option>
                      <option value="Piece">Piece</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="food-fullname" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Full Name / Organization
                  </label>
                  <input
                    id="food-fullname"
                    name="donorName"
                    type="text"
                    value={foodForm.donorName}
                    onChange={handleFoodChange}
                    placeholder="Name or organization"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="food-contact" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Contact Number
                  </label>
                  <input
                    id="food-contact"
                    name="contactInfo"
                    type="text"
                    value={foodForm.contactInfo}
                    onChange={handleFoodChange}
                    placeholder="09XX XXX XXXX"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="food-date" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Date Given
                  </label>
                  <input
                    id="food-date"
                    name="dateGiven"
                    type="date"
                    value={foodForm.dateGiven}
                    onChange={handleFoodChange}
                    className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="delivery-method" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Delivery Method
                  </label>
                  <select
                    id="delivery-method"
                    name="deliveryMethod"
                    value={foodForm.deliveryMethod}
                    onChange={handleFoodChange}
                    className={`w-full max-w-md rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                    }`}
                  >
                    <option>I will drop off at the municipal office</option>
                    <option>Please schedule for pickup</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="pickup-address" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Pickup Address (if applicable)
                </label>
                <textarea
                  id="pickup-address"
                  rows="3"
                  name="pickupAddress"
                  value={foodForm.pickupAddress}
                  onChange={handleFoodChange}
                  placeholder="Full address for pickup..."
                  className={`w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="food-image" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Donation Photo (Optional)
                </label>
                <input
                  id="food-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFoodImageFile(event.target.files?.[0] || null)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={foodSubmitting}
                className="mt-2 w-full rounded-lg bg-blue-700 px-5 py-3 text-base md:text-lg font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
              >
                {foodSubmitting ? 'Submitting...' : '📦 Submit Food Donation'}
              </button>
            </form>
          </article>
        ) : null}

        {selectedChannel === 'supplies' ? (
          <article className={`mt-6 rounded-xl border p-5 md:p-7 ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-[#f3f6f8]'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-lg ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>📦</span>
              <h2 className={`font-display text-xl md:text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#071a2f]'}`}>
                Supplies Donation
              </h2>
            </div>
            <p className={`mt-2 text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Donate cooking equipment, containers, or distribution materials
            </p>

            {suppliesSuccess && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {suppliesSuccess}
              </div>
            )}
            {suppliesError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {suppliesError}
              </div>
            )}
            {foodSuppliesError && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {foodSuppliesError}
              </div>
            )}

            <form className="mt-7 space-y-4" onSubmit={handleSuppliesSubmit}>
              <div>
                <label htmlFor="supplies-barangay" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Donate to Barangay (Optional)
                </label>
                <select
                  id="supplies-barangay"
                  name="barangayId"
                  value={suppliesForm.barangayId}
                  onChange={handleSuppliesChange}
                  className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                  }`}
                >
                  <option value="">No preference (municipality decides)</option>
                  {barangays.map((b) => (
                    <option key={b.barangay_id} value={b.barangay_id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supplies-type" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Type of Supplies
                  </label>
                  <input
                    id="supplies-type"
                    name="foodName"
                    list="food-options"
                    value={suppliesForm.foodId ? (foodSupplies.find((f) => Number(f.food_id) === Number(suppliesForm.foodId))?.food_name || '') : suppliesForm.foodDescription}
                    onChange={handleSuppliesChange}
                    placeholder="Select or type supplies type"
                    className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="supplies-quantity" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Quantity/Description
                  </label>
                  <input
                    id="supplies-quantity"
                    name="quantity"
                    type="text"
                    value={suppliesForm.quantity}
                    onChange={handleSuppliesChange}
                    placeholder="e.g., 10 large pots, 50 containers"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="supplies-donor" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Full Name / Organization
                  </label>
                  <input
                    id="supplies-donor"
                    name="donorName"
                    type="text"
                    value={suppliesForm.donorName}
                    onChange={handleSuppliesChange}
                    placeholder="Name or organization"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="supplies-contact" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Contact Number
                  </label>
                  <input
                    id="supplies-contact"
                    name="contactInfo"
                    type="text"
                    value={suppliesForm.contactInfo}
                    onChange={handleSuppliesChange}
                    placeholder="09XX XXX XXXX"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="supplies-date" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Date Given
                  </label>
                  <input
                    id="supplies-date"
                    name="dateGiven"
                    type="date"
                    value={suppliesForm.dateGiven}
                    onChange={handleSuppliesChange}
                    className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="supplies-condition" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Item Condition
                  </label>
                  <select
                    id="supplies-condition"
                    name="condition"
                    value={suppliesForm.condition}
                    onChange={handleSuppliesChange}
                    className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                    }`}
                  >
                    <option>Brand New</option>
                    <option>Lightly Used</option>
                    <option>Used</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="supplies-image" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Donation Photo (Optional)
                </label>
                <input
                  id="supplies-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSuppliesImageFile(event.target.files?.[0] || null)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="supplies-notes" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Additional Notes
                </label>
                <textarea
                  id="supplies-notes"
                  rows="3"
                  name="notes"
                  value={suppliesForm.notes}
                  onChange={handleSuppliesChange}
                  placeholder="Any additional details about the supplies..."
                  className={`w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={suppliesSubmitting}
                className="mt-2 w-full rounded-lg bg-blue-700 px-5 py-3 text-base md:text-lg font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
              >
                {suppliesSubmitting ? 'Submitting...' : '📦 Submit Supplies Donation'}
              </button>
            </form>
          </article>
        ) : null}

        <article className={`mt-6 rounded-xl border p-5 md:p-7 font-body ${
          isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-[#f3f6f8]'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`grid h-8 w-8 place-items-center rounded-full ${
              isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-[#d3dde7] text-slate-800'
            }`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s-6.5-4.35-9-8.5A5.4 5.4 0 0 1 12 5a5.4 5.4 0 0 1 9 7.5C18.5 16.65 12 21 12 21Z" />
              </svg>
            </span>
            <h2 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#071a2f]'}`}>
              Recent Donors
            </h2>
          </div>
          <p className={`mt-2 text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Thank you to our generous donors
          </p>

          {recentDonors.length > 0 ? (
            <div className="mt-6 space-y-3">
              {(showAllDonors ? recentDonors : recentDonors.slice(0, 6)).map((donor) => (
                <div
                  key={donor.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 md:px-5 md:py-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-[#e8edf1]'
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    {donor.image ? (
                      <img
                        src={`data:image/jpeg;base64,${donor.image}`}
                        alt="Donation photo"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className={`grid h-10 w-10 place-items-center rounded-full ${
                        isDarkMode ? 'bg-slate-700 text-slate-100' : 'bg-[#d3dde7] text-blue-700'
                      }`}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 21s-6.5-4.35-9-8.5A5.4 5.4 0 0 1 12 5a5.4 5.4 0 0 1 9 7.5C18.5 16.65 12 21 12 21Z" />
                        </svg>
                      </span>
                    )}
                    <div>
                      <p className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-[#071a2f]'}`}>
                        {donor.name}
                      </p>
                      <p className={`text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {donor.type}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#071a2f]'}`}>
                      {donor.amount}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {donor.when}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`mt-6 rounded-xl border px-4 py-5 text-sm md:text-base ${
              isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-[#e8edf1] text-slate-700'
            }`}>
              {donorError || 'Recent donor entries will appear here once real donation records are available.'}
            </div>
          )}

          {!showAllDonors && recentDonors.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllDonors(true)}
              className={`mt-5 w-full rounded-lg border px-5 py-3 text-base md:text-lg font-semibold transition-colors ${
                isDarkMode
                  ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'border-slate-300 bg-[#e8edf1] text-[#071a2f] hover:bg-[#dde5ea]'
              }`}
            >
              View All Donors →
            </button>
          )}
        </article>
      </section>

      <Footer isDarkMode={isDarkMode} />
    </main>
  )
}

export default DonationPage
