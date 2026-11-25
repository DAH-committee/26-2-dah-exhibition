import { color, font, type, radius, shadow, space, layout, z } from './src/styles/tokens.js'

const toCss = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), Array.isArray(v) ? v.map(f => (f.includes(' ') ? `'${f}'` : f)).join(', ') : v]))

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: color,
      fontFamily: font,
      borderRadius: radius,
      boxShadow: { e0: shadow[0], e1: shadow[1], e2: shadow[2], e3: shadow[3] },
      spacing: { s1: space[1], s2: space[2], s3: space[3], s4: space[4], s5: space[5], s6: space[6], s7: space[7], s8: space[8], s9: space[9], s10: space[10], page: layout.pageX, top: layout.topBar },
      maxWidth: { text: layout.maxText },
      zIndex: Object.fromEntries(Object.entries(z).map(([k, v]) => [k, String(v)])),
      screens: { xs: '320px', sm: '390px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px', '3xl': '1920px' },
      transitionTimingFunction: { soft: 'cubic-bezier(0.45, 0, 0.55, 1)', out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents(Object.fromEntries(Object.entries(type).map(([k, v]) => ['.t-' + k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), toCss(v)])))
    },
  ],
}
