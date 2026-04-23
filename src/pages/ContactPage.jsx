import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'
import SiteHeader from '../components/SiteHeader'
import contactIcon from '../assets/contact-icon.png'
import emailIcon from '../assets/email-icon.png'
import locationIcon from '../assets/location-icon.png'
import officeHoursIcon from '../assets/office-hours-icon.png'

function ContactPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
   <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eaf1ef] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <section className="mx-auto w-[95%] max-w-5xl py-10 md:py-14">
        <div className={`mb-6 md:mb-8 rounded-2xl border p-6 md:p-8 shadow-sm transition-colors ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <h2
            className={`text-2xl md:text-3xl font-extrabold ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`}
            style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
          >
            GET IN TOUCH
          </h2>
          <p className={`mt-4 text-base md:text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Reach out to the Pateros Zero Hunger Management team for support, feedback, and coordination concerns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
          <div className={`rounded-xl border p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center text-center ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
           <img src={contactIcon} alt="Contact" className="h-12 w-12 mb-4" />

            <h3 className="text-lg font-bold mb-3">Contact Number</h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              +63 917 863 5377<br />
              (02) 944 3100
            </p>
          </div>

      
          <div className={`rounded-xl border p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center text-center ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
           <img src={emailIcon} alt="Email" className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-bold mb-3">Email</h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              GoPateros@gmail.com<br />
              PaterosHAMS@gmail.com
            </p>
          </div>

          
          <div className={`rounded-xl border p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center text-center ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
           <img src={locationIcon} alt="Location" className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-bold mb-3">Location</h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              841 G. de Borja Street, Pateros, 1620 Metro Manila, Philippines.
            </p>
          </div>

       
          <div className={`rounded-xl border p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center text-center ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
           <img src={officeHoursIcon} alt="Office Hours" className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-bold mb-3">Office Hours</h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Monday to Friday<br />
              7:00AM - 5:00PM
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ContactPage
