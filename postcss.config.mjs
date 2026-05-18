/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // 👈 This is the new Tailwind v4 engine plugin!
  },
};

export default config;