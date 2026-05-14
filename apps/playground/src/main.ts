import { createApp } from 'vue';
import 'quill/dist/quill.snow.css';
// Quolt theme imported AFTER Quill's snow stylesheet so foundation tokens
// override snow's defaults on selectors we both target.
import 'quolt-themes/theme.css';
import './style.css';
import App from './App.vue';

createApp(App).mount('#app');
