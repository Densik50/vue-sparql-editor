import SparqlEditor from './components/SparqlEditor.vue'
import 'primevue/resources/themes/mdc-dark-indigo/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import Dialog from 'primevue/dialog';
import TabMenu from 'primevue/tabmenu';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Menubar from 'primevue/menubar';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import PrimeVue from 'primevue/config';
export default {
    install: (app, options) => {
        app.use(PrimeVue)
        app.component('PrimeVueDialog', Dialog)
        app.component('PrimeVueTabMenu', TabMenu)
        app.component('PrimeVueTabView', TabView)
        app.component('PrimeVueTabPanel', TabPanel)
        app.component('PrimeVueMenubar', Menubar)
        app.component('PrimeVueDropdown', Dropdown)
        app.component('PrimeVueDataTable', DataTable)
        app.component('PrimeVueColumn', Column)
        app.component('PrimeVueButton', Button)
        app.component('PrimeVueFileUpload', FileUpload)
        app.component('PrimeVueInputText', InputText)
        app.component("SparqlEditor", SparqlEditor)
    },
}