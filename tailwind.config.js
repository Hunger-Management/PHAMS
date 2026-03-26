export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'phams-dark': '#0f0f10',
        'phams-blue': '#243f63',
        'phams-header': '#f5f4f3',
        'phams-nav': '#d8d8d8',
        'phams-panel': '#d2d3d6',
        'phams-seal': '#0f375a',
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
