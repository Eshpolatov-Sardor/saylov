/** @type {import('tailwindcss').Config} */
import { getIconCollections, iconsPlugin } from "@egoist/tailwindcss-icons"

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "open-sans-condensed": ["\"Open Sans Condensed\"", "sans-serif"],
      },
      colors: {
        "custom-gray": "#464646",
        "custom-teal": "#00b3a0",
        "custom-light-gray": "#e2e8e7",
        "custom-blue": "#00aacf",
        "custom-yellow": "#f6c574",
        "custom-red": "#fc5652",
      },
    },
  },
  plugins: [
    iconsPlugin({
      // Select the icon collections you want to use
      // You can also ignore this option to automatically discover all individual icon packages you have installed
      // If you install @iconify/json, you should explicitly specify the collections you want to use, like this:
      collections: getIconCollections(["carbon"]),
      // If you want to use all icons from @iconify/json, you can do this:
      // collections: getIconCollections("all"),
      // and the more recommended way is to use `dynamicIconsPlugin`, see below.
    }),
  ],
}
