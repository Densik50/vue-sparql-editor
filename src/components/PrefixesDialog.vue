<template>
    <div>
        <PrimeVueDialog header="Create new group" v-model:visible="show_new_group_dialog"
            :modal="false" :draggable="false" ref="newgroupdialog">
            <span class="p-float-label">
                <PrimeVueInputText id="group_name_input" type="text" v-model="group_name" />
                <label for="group_name_input">Group name</label>
            </span>
            <PrimeVueButton label="Create" icon="pi pi-plus" class="p-button-success p-mr-2 p-col" @click="createNewGroup(group_name)" :disabled="!group_name"/>
        </PrimeVueDialog>

        <PrimeVueDialog header="Create new entry" v-model:visible="show_new_entry_dialog"
            :modal="false" :draggable="false" ref="newentrydialog">
            <span class="p-float-label">
                <PrimeVueInputText id="entry_namespace_input" type="text" v-model="entry_namespace" />
                <label for="entry_namespace_input">Namespace</label>
            </span>
            <span class="p-float-label">
                <PrimeVueInputText id="entry_uri_input" type="text" v-model="entry_iri" />
                <label for="entry_uri_input">URI</label>
            </span>
            <PrimeVueButton label="Create" icon="pi pi-plus" class="p-button-success p-mr-2 p-col" @click="createNewEntry(entry_namespace, entry_iri)"/>
        </PrimeVueDialog>

        <div class="p-grid" style="padding-bottom: 5px;">
            <PrimeVueDropdown
                class="p-dropdown p-col"
                v-model="selected_group"
                :options="prefixes_data"
                optionLabel="name"
                placeholder="Select a group"
                @change="changeDisplayedGroupData()"
            />
            <PrimeVueButton
                label="Group"
                icon="pi pi-plus"
                class="p-button-sm p-button-success p-mr-2 p-col"
                @click="openNewGroupDialog"
                style="margin-left: 10px;"
            />
            <PrimeVueButton
                label="Insert group"
                class="p-button-sm p-button-info p-col"
                @click="insertGroup"
                style="margin-left: 10px;"
            />
            <PrimeVueButton
                label="Group"
                icon="pi pi-trash"
                class="p-button-sm p-button-danger p-col"
                @click="deleteSelectedGroup"
                :disabled="!selected_group"
                style="margin-left: 10px;"
            />
            <PrimeVueButton
                label="Entry"
                icon="pi pi-plus"
                class="p-button-sm p-button-success p-mr-2 p-col"
                @click="openNewEntryDialog"
                :disabled="!selected_group"
                style="margin-left: 10px;"
            />
        </div>

        <PrimeVueDataTable
            :value="displayed_group_data"
            class="p-datatable-sm editable-cells-table"
            responsiveLayout="scroll"
            :resizableColumns="true"
            columnResizeMode="fit"
            showGridlines
            stripedRows
            editMode="cell"
            @cell-edit-complete="onCellEditComplete"
        >
            <PrimeVueColumn 
                field="namespace"
                header="Prefix"
                :sortable="true"
            >
                <template #editor="{ data, field }">
                    <PrimeVueInputText v-model="data[field]"/>
                </template>
            </PrimeVueColumn>
            <PrimeVueColumn 
                field="uri"
                header="URI"
                :sortable="true"
            >
                <template #editor="{ data, field }">
                    <PrimeVueInputText v-model="data[field]"/>
                </template>
            </PrimeVueColumn>
            <PrimeVueColumn
                style="width:25%"
            >
                <template #body="slotEntry">
                    <PrimeVueButton label="Insert" icon="pi pi-arrow-right" class="p-button-sm p-button-info tablebuttons" @click="insertEntry(slotEntry.data)"/>
                    <PrimeVueButton label="Delete" icon="pi pi-trash" class="p-button-sm p-button-warning tablebuttons" @click="deleteEntry(slotEntry.data)" style="margin-left: 10px;"/>
                </template>
            </PrimeVueColumn>
        </PrimeVueDataTable>

        <div style="padding-top: 10px;">
            <PrimeVueButton label="Export" icon="pi pi-download" class="p-button-sm p-button-help p-col" @click="saveDataAsJson" style="float: right; margin-left: 10px;" />
            <PrimeVueFileUpload
            mode="basic"
            accept=".json"
            label="Import"
            chooseLabel="Import"
            class="p-button-sm p-mr-2 p-d-inline-block"
            style="margin-left: 10px;"
            :customUpload="true"
            :auto="true"
            @uploader="myUploader"/>
        </div>
    </div>
</template>
<script>

export default {
    name: 'PrefixesDialog',
    emits: ['insertEntryIntoCode', 'insertEntryGroupIntoCode'],
    data() {
        return {
            selected_group: null,
            displayed_group_data: null,
            show_new_group_dialog: false,
            group_name: '',
            show_new_entry_dialog: false,
            entry_namespace: '',
            entry_iri: '',
            prefixes_data: [],
        }
    },
    created() {
        let retrived_object = window.localStorage.getItem('sparqleditor_prefixes')
        this.prefixes_data = JSON.parse(retrived_object) || [];
    },
    methods: {
        // displayed_group_data is displayed by data table, we want to show data from currently selected group
        changeDisplayedGroupData() {
            this.displayed_group_data = this.selected_group.data;
        },
        // open new group dialog
        openNewGroupDialog(){
            this.show_new_group_dialog = true
        },
        // open new group dialog
        openNewEntryDialog(){
            this.show_new_entry_dialog = true
        },
        // creates new group to which we can add iris
        createNewGroup(name){
            this.prefixes_data.push({"name": name, "data":[]});
            window.localStorage.setItem('sparqleditor_prefixes', JSON.stringify(this.prefixes_data));
            this.group_name = ''
            this.show_new_group_dialog = false
        },
        // deletes currently displayed group
        deleteSelectedGroup() {
            this.prefixes_data.splice(this.prefixes_data.indexOf(this.selected_group), 1);
            this.selected_group = null
            this.displayed_group_data = null
            window.localStorage.setItem('sparqleditor_prefixes', JSON.stringify(this.prefixes_data));
        },
        createNewEntry(namespace, uri) {
            this.prefixes_data[this.prefixes_data.indexOf(this.selected_group)].data.push({"namespace": namespace, "uri": uri});
            window.localStorage.setItem('sparqleditor_prefixes', JSON.stringify(this.prefixes_data));
            this.namespace = ''
            this.uri = ''
            this.show_new_entry_dialog = false
        },
        deleteEntry(event){
            this.prefixes_data[this.prefixes_data.indexOf(this.selected_group)].data.splice(this.prefixes_data[this.prefixes_data.indexOf(this.selected_group)].data.indexOf(event), 1);
            window.localStorage.setItem('sparqleditor_prefixes', JSON.stringify(this.prefixes_data));
        },

        //converts prefixes_data array into json and downloads it as file
        saveDataAsJson(){
            let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.prefixes_data));
            let downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href",     dataStr);
            downloadAnchorNode.setAttribute("download", "prefixes_data.json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        },
        //reads json file and rewrites prefixes_data
        myUploader(event) {
            //file reader
            let fr = new FileReader();
            //view model
            //let vm = this;

            fr.onload = (e) => {
                let result = JSON.parse(e.target.result);
                result.forEach(group => {
                    //rewrite groups with same name, otherwise push group into data
                    if((this.prefixes_data.find(element => element.name === group.name)) != undefined){
                        this.prefixes_data[this.prefixes_data.indexOf(this.prefixes_data.find(element => element.name === group.name))] = group
                    } else {
                        this.prefixes_data.push(group)
                    }
                })
                window.localStorage.setItem('sparqleditor_prefixes', JSON.stringify(this.prefixes_data));
            }
            fr.readAsText(event.files[0]);
            //TODO reset fileuploader
        },
        insertGroup() {
            this.$emit('insertEntryGroupIntoCode', this.prefixes_data[this.prefixes_data.indexOf(this.selected_group)])
        },
        insertEntry(entry) {
            this.$emit('insertEntryIntoCode', entry);
        },
        onCellEditComplete(event) {
            let { data, newValue, field } = event
            data[field] = newValue
            //save data
            window.localStorage.setItem('sparqleditor_prefixes', JSON.stringify(this.prefixes_data))
        },
    }
}


</script>
<style>
.p-inputtext {
    padding: 0;
}

.p-fileupload.p-fileupload-basic.p-component {
    display: inline-flex;
    float: right;
}
span.p-button.p-component.p-fileupload-choose.p-mr-2.p-d-block {
    top: 2px;
}
.tablebuttons {
    height: 1.5rem;
}
</style>