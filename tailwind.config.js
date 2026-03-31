/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        actevix: {
          bg: "#0D1117",
          teal: "#1D9E75",
          blue: "#38BDF8",
          surface: "#131920",
          border: "#1E2A36",
        },
      },
      fontFamily: {
        heading: ["Syne_700Bold"],
        "heading-semibold": ["Syne_600SemiBold"],
        "heading-regular": ["Syne_400Regular"],
        body: ["DMSans_400Regular"],
        "body-medium": ["DMSans_500Medium"],
      },
    },
  },
  plugins: [],
};
