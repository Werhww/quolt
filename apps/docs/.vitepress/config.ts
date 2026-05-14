import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Quolt',
  description: 'A modern wrapper for Quill.js — beautiful defaults, clean API, idiomatic framework bindings.',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/quolt-editor' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting started',
          items: [
            { text: 'Installation', link: '/guide/getting-started' },
            { text: 'Custom formats', link: '/guide/custom-formats' },
            { text: 'Component embeds (Vue)', link: '/guide/component-embeds' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'Core',
          items: [
            { text: 'QuoltEditor', link: '/api/quolt-editor' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Werhww/quolt' },
    ],
  },
});
