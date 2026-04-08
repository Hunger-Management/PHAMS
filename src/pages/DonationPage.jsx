import { useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import Footer from '../components/Footer'
import SiteHeader from '../components/SiteHeader'

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

const recentDonors = []

function DonationPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [selectedChannel, setSelectedChannel] = useState('monetary')
  const [selectedAmount, setSelectedAmount] = useState(500)
  const [customAmount, setCustomAmount] = useState('')

  const donationAmounts = [500, 1000, 2500, 5000, 10000]
  const resolvedAmount = Number(customAmount) > 0 ? Number(customAmount) : selectedAmount

  function formatPhpAmount(amount) {
    return new Intl.NumberFormat('en-PH').format(amount)
  }

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#dde5ea] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <section className="mx-auto w-[98%] max-w-[1600px] py-4 md:py-5 font-body">
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

            <div className="mt-7">
              <h3 className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Select Amount (PHP)</h3>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                {donationAmounts.map((amount) => {
                  const isSelected = selectedAmount === amount && customAmount === ''

                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount)
                        setCustomAmount('')
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

            <form className="mt-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full-name" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    type="text"
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
                    defaultValue="Bank Transfer"
                    className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                    }`}
                  >
                    <option>Bank Transfer</option>
                    <option>GCash</option>
                    <option>Maya</option>
                    <option>Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="donation-message" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Message (Optional)
                </label>
                <textarea
                  id="donation-message"
                  rows="3"
                  placeholder="Any message or dedication for your donation..."
                  className={`w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>

              <button
                type="button"
                className="mt-2 w-full rounded-lg bg-blue-700 px-5 py-3 text-base md:text-lg font-semibold text-white transition-colors hover:bg-blue-800"
              >
                ♡ Donate PHP {formatPhpAmount(resolvedAmount)}
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

            <form className="mt-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="food-type" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Type of Food
                  </label>
                  <select
                    id="food-type"
                    defaultValue=""
                    className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                    }`}
                  >
                    <option value="" disabled>Select food type</option>
                    <option>Rice</option>
                    <option>Canned Goods</option>
                    <option>Vegetables</option>
                    <option>Mixed Goods</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="estimated-quantity" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Estimated Quantity
                  </label>
                  <input
                    id="estimated-quantity"
                    type="text"
                    placeholder="e.g., 50kg, 100 cans"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="food-fullname" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Full Name / Organization
                  </label>
                  <input
                    id="food-fullname"
                    type="text"
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
                    type="text"
                    placeholder="09XX XXX XXXX"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="delivery-method" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Delivery Method
                  </label>
                  <select
                    id="delivery-method"
                    defaultValue="I will drop off at the municipal office"
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
                  placeholder="Full address for pickup..."
                  className={`w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>

              <button
                type="button"
                className="mt-2 w-full rounded-lg bg-blue-700 px-5 py-3 text-base md:text-lg font-semibold text-white transition-colors hover:bg-blue-800"
              >
                📦 Submit Food Donation
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

            <form className="mt-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supplies-type" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Type of Supplies
                  </label>
                  <select
                    id="supplies-type"
                    defaultValue=""
                    className={`w-full max-w-xs rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900'
                    }`}
                  >
                    <option value="" disabled>Select supplies type</option>
                    <option>Containers</option>
                    <option>Cooking Equipment</option>
                    <option>Distribution Materials</option>
                    <option>Other Supplies</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="supplies-quantity" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Quantity/Description
                  </label>
                  <input
                    id="supplies-quantity"
                    type="text"
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
                    type="text"
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
                    type="text"
                    placeholder="09XX XXX XXXX"
                    className={`w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                        : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="supplies-condition" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Item Condition
                  </label>
                  <select
                    id="supplies-condition"
                    defaultValue="Brand New"
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
                <label htmlFor="supplies-notes" className={`mb-1 block text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Additional Notes
                </label>
                <textarea
                  id="supplies-notes"
                  rows="3"
                  placeholder="Any additional details about the supplies..."
                  className={`w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400'
                      : 'border-slate-300 bg-[#f5f7f9] text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>

              <button
                type="button"
                className="mt-2 w-full rounded-lg bg-blue-700 px-5 py-3 text-base md:text-lg font-semibold text-white transition-colors hover:bg-blue-800"
              >
                📦 Submit Supplies Donation
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
              {recentDonors.map((donor) => (
                <div
                  key={`${donor.name}-${donor.when}`}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 md:px-5 md:py-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-[#e8edf1]'
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className={`grid h-10 w-10 place-items-center rounded-full ${
                      isDarkMode ? 'bg-slate-700 text-slate-100' : 'bg-[#d3dde7] text-blue-700'
                    }`}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 21s-6.5-4.35-9-8.5A5.4 5.4 0 0 1 12 5a5.4 5.4 0 0 1 9 7.5C18.5 16.65 12 21 12 21Z" />
                      </svg>
                    </span>
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
              Recent donor entries will appear here once real donation records are available.
            </div>
          )}

          <button
            type="button"
            className={`mt-5 w-full rounded-lg border px-5 py-3 text-base md:text-lg font-semibold transition-colors ${
              isDarkMode
                ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                : 'border-slate-300 bg-[#e8edf1] text-[#071a2f] hover:bg-[#dde5ea]'
            }`}
          >
            View All Donors →
          </button>
        </article>
      </section>

      <Footer isDarkMode={isDarkMode} />
    </main>
  )
}

export default DonationPage
