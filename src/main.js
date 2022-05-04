import { createApp } from 'vue'
import App from './App.vue'
import SparqlEditorPlugin from './index.js'
const app = createApp(App)
app.use(SparqlEditorPlugin)
app.mount('#app')