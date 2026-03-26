function HomePage() {
  return (
    <main className="min-h-screen bg-stone-100">
      {/* header area */}
      <header className="bg-stone-100 border-b border-gray-300 shadow-sm">
        {/* top row*/}
        <div className="flex items-center justify-between gap-4 px-6 md:px-10 py-3 md:py-2">
          {/* brand side */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <img
              src="/pateros-zero-hunger-logo.png"
              alt="Pateros Zero Hunger Management System logo"
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover flex-shrink-0"
            />

            {/* site name */}
            <h1 className="flex-1 font-playfair font-bold leading-tight text-gray-900 text-xs md:text-sm lg:text-base min-w-0">
              PATEROS
              <br />
              ZERO HUNGER
              <br />
              MANAGEMENT SYSTEM
            </h1>
          </div>

          {/* right side actions */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            {/* search */}
            <div className="flex items-center gap-2 bg-gray-200 rounded-full px-3 md:px-4 py-2 border border-gray-300 shadow-sm whitespace-nowrap">
              <input
                id="site-search"
                type="search"
                placeholder="Search"
                aria-label="Search"
                className="bg-transparent border-0 outline-0 font-poppins text-xs md:text-sm w-24 md:w-32 text-gray-700 placeholder-gray-500"
              />
              <button type="submit" className="text-gray-600 text-base md:text-lg font-bold hover:text-gray-800 flex-shrink-0">
                🔍
              </button>
            </div>

            <div className="flex items-center gap-0 flex-shrink-0">
              <img
                src="/nu-1900-logo-transparent.png"
                alt="NU 1900 logo"
                className="w-16 h-16 md:w-20 md:h-20 object-contain"
              />
              <img
                src="/photo_2026-03-27_01-04-38.jpg"
                alt="CCT logo"
                className="-ml-2 md:-ml-3 w-28 h-28 md:w-32 md:h-24 object-contain mix-blend-multiply"
              />
            </div>

          </div>
        </div>

        {/* menu bar */}
        <nav className="bg-gray-300 border-t border-gray-400 flex items-center justify-between px-8 md:px-12 py-3 md:py-3.5">
          <a href="#" className="font-playfair font-bold text-gray-900 text-base md:text-lg lg:text-xl tracking-tight whitespace-nowrap hover:text-gray-700">
            HOME
          </a>
          <a href="#" className="font-playfair font-bold text-gray-900 text-base md:text-lg lg:text-xl tracking-tight whitespace-nowrap hover:text-gray-700">
            ABOUT US ▾
          </a>
          <a href="#" className="font-playfair font-bold text-gray-900 text-base md:text-lg lg:text-xl tracking-tight whitespace-nowrap hover:text-gray-700">
            BARANGAY ▾
          </a>
          <a href="#" className="font-playfair font-bold text-gray-900 text-base md:text-lg lg:text-xl tracking-tight whitespace-nowrap hover:text-gray-700">
            TRANSPARENCY ▾
          </a>
          <a href="#" className="font-playfair font-bold text-gray-900 text-base md:text-lg lg:text-xl tracking-tight whitespace-nowrap hover:text-gray-700">
            CONTACT US
          </a>
        </nav>
      </header>

      {/* hero section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-11/12 max-w-6xl mx-auto py-12 md:py-16 lg:py-20 items-center">
        {/* big headline */}
        <div>
          <h2 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-black leading-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            PATEROS
            <br />
            ZERO HUNGER
            <br />
            MANAGEMENT
            <br />
            SYSTEM
          </h2>
        </div>

        {/* image placeholder */}
        <div className="h-64 md:h-80 lg:h-96 rounded-3xl bg-gradient-to-br from-gray-300 via-gray-250 to-gray-400 border-4 border-gray-400 shadow-lg" />
      </section>

      {/* slider dots */}
      <div className="flex justify-center gap-3 pb-8 md:pb-12">
        <span className="w-4 h-3 rounded-full bg-gray-500" />
        <span className="w-3 h-3 rounded-full bg-gray-500" />
        <span className="w-3 h-3 rounded-full bg-gray-500" />
        <span className="w-3 h-3 rounded-full bg-gray-500" />
        <span className="w-4 h-3 rounded-full bg-gray-500" />
      </div>
    </main>
  )
}

export default HomePage
