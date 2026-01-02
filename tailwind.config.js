/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Prose styling for markdown
    'prose-strong:text-yellow-300',
    'prose-strong:text-yellow-200',
    'prose-strong:font-bold',
    'prose-em:text-blue-200',
    'prose-code:text-pink-300',
    'prose-code:bg-blue-600/30',
    'prose-code:px-1',
    'prose-code:rounded',
    'prose-p:my-2',
    'prose-p:leading-relaxed',
    'prose-p:text-white',
    'prose-ul:my-2',
    'prose-li:my-1',
    'prose-li:text-white',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}