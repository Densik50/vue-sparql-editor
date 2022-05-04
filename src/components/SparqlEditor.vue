<template>
	<div style="height: 100%">
		<!-- Editor bar -->
		<PrimeVueMenubar :model="editorBarItems" class="editor_bar"/>
		<PrimeVueTabView v-model:activeIndex="tabSelected" :scrollable="true" @tab-change="tabChanged">
			<PrimeVueTabPanel v-for="tab in tabs_list" :key="tab.label" :header="tab.label"/>
		</PrimeVueTabView>

		<!-- Textarea used for CodeMirror -->
		<textarea v-model="contents[tabSelected]" id="editor"></textarea>

		<!-- Editor footer -->
		<div class="editor_footer"> Ln {{this.currentLineNumber}}, Col {{this.currentColNumber}}</div>

		<!-- Dialog popups -->
		<PrimeVueDialog header="Prefixes manager" v-model:visible="displayPrefixes"
			:style="{width: '75vw'}" :maximizable="true"
			:modal="false" :draggable="false" ref="prefixesdialog">
			<PrefixesDialog
				@insertEntryIntoCode="insertEntry"
				@insertEntryGroupIntoCode="insertEntryGroup"
			/>
		</PrimeVueDialog>

		<PrimeVueDialog header="Preferences" v-model:visible="displayPreferences"
			:style="{width: '75vw'}" :maximizable="true"
			:modal="false" :draggable="false" ref="preferencesdialog">
			<PreferencesDialog
				@fontSizeChanged="changeFontSize"
				@themeChanged="changeTheme"
			/>
		</PrimeVueDialog>
	</div>
</template>

<script>
import * as CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/sparql/sparql.js';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/hint/anyword-hint.js';
import 'codemirror/addon/edit/matchbrackets.js';
import 'codemirror/addon/edit/closebrackets.js';

// all themes
import 'codemirror/theme/3024-day.css'
import 'codemirror/theme/3024-night.css'
import 'codemirror/theme/abcdef.css'
import 'codemirror/theme/ambiance.css'
import 'codemirror/theme/base16-dark.css'
import 'codemirror/theme/base16-light.css'
import 'codemirror/theme/bespin.css'
import 'codemirror/theme/blackboard.css'
import 'codemirror/theme/cobalt.css'
import 'codemirror/theme/colorforth.css'
import 'codemirror/theme/dracula.css'
import 'codemirror/theme/duotone-dark.css'
import 'codemirror/theme/duotone-light.css'
import 'codemirror/theme/eclipse.css'
import 'codemirror/theme/elegant.css'
import 'codemirror/theme/erlang-dark.css'
import 'codemirror/theme/hopscotch.css'
import 'codemirror/theme/icecoder.css'
import 'codemirror/theme/isotope.css'
import 'codemirror/theme/lesser-dark.css'
import 'codemirror/theme/liquibyte.css'
import 'codemirror/theme/material.css'
import 'codemirror/theme/mbo.css'
import 'codemirror/theme/mdn-like.css'
import 'codemirror/theme/midnight.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/theme/neat.css'
import 'codemirror/theme/neo.css'
import 'codemirror/theme/night.css'
import 'codemirror/theme/panda-syntax.css'
import 'codemirror/theme/paraiso-dark.css'
import 'codemirror/theme/paraiso-light.css'
import 'codemirror/theme/pastel-on-dark.css'
import 'codemirror/theme/railscasts.css'
import 'codemirror/theme/rubyblue.css'
import 'codemirror/theme/seti.css'
import 'codemirror/theme/the-matrix.css'
import 'codemirror/theme/tomorrow-night-bright.css'
import 'codemirror/theme/tomorrow-night-eighties.css'
import 'codemirror/theme/ttcn.css'
import 'codemirror/theme/twilight.css'
import 'codemirror/theme/vibrant-ink.css'
import 'codemirror/theme/xq-dark.css'
import 'codemirror/theme/xq-light.css'
import 'codemirror/theme/yeti.css'
import 'codemirror/theme/zenburn.css'

import { PrimeIcons } from 'primevue/api';
import { nextTick } from 'vue'
import PrefixesDialog from '/src/components/PrefixesDialog.vue'
import PreferencesDialog from '/src/components/PreferencesDialog.vue'

export default {
	name: 'SparqlEditor',
	props: {
	codeValue: String,
	},
	components:{
		PrefixesDialog,
		PreferencesDialog,
	},
	data(){
		return{
			theme: 'rubyblue',
			currentLineNumber: "",
			currentColNumber: "",
			contents: [],
			tabs_list: [{label: 'Main'},],
			tabsAmount: 1,
			tabSelected: 0,
			fontSize: 12,
			displayPrefixes: false,
			displayPreferences: false,
			show_querry_panel: false,
			position: 'center',
			editorBarItems: [
				{
					label:'Prefixes',
					icon: PrimeIcons.DATABASE,
					command: () => {
					this.displayPrefixes = true;
					},
				}, {
					label: 'Preferences',
					icon: PrimeIcons.USER,
					command: () => {
						this.displayPreferences = true
					},
				}, {
					label: 'Add Tab',
					icon:'',
					command: () => {
						this.addTab()
					},
				}, {
					label: 'Delete Tab',
					icon: '',
					command: () => {
						this.deleteTab()
					},
				}],
		}
},
	mounted(){
		/**
		 * Creates Codemirror instance from textarea in template with our options.
		 */
		this.cm = CodeMirror.fromTextArea(document.getElementById('editor'), {
			id: "codemirror",
			viewportMargin: Infinity,
			lineNumbers: true,
			theme: this.theme,
			mode: 'sparql',
			autofocus: true,
			matchBrackets: true,
			autoCloseBrackets: true,
			lineWrapping: true,
			extraKeys: {"Ctrl-Space": "autocomplete" },
			completeSingle: false,
			hintOptions: {
				completeSingle:false,
			}});
		
		/**
		 * Array containing SPARQL keywords in uppercase. This array is used to construct lower case copy and then these 2 merged are used for
		 * autocompletion.
		 */
		const keyWordsUp=[
				"BASE", "PREFIX", "SELECT", "ASK", "CONSTRUCT", "DESCRIBE", "DISTINCT", "REDUCED",
				"FROM", "NAMED", "WHERE", "GRAPH", "UNION", "FILTER", "OPTIONAL", "ORDER",
				"LIMIT", "OFFSET", "BY", "ASC", "DESC", "STR", "LANG", "LANGMATCHES",
				"DATATYPE", "BOUND", "SAMETERM", "ISIRI", "ISURI", "ISBLANK", "ISLITERAL", "REGEX",
				"CONCAT", "BIND", "NOT", "EXISTS", "MINUS", "AS", "VALUES", "UNDEF",
				"GROUP", "HAVING", "SUM", "AVG", "REDUCED"]
		const keyWordsLow = keyWordsUp.map(element => {
			return element.toLowerCase();
		})
		const keyWords = keyWordsUp.concat(keyWordsLow)

		/**
		 * Overwriting Codemirrors anyhint autocompletion mode for SPARQL autocompletion.
		 */
		CodeMirror.hint.anyword = function (editor) {
				//get cursor and current line
				const cursor = editor.getCursor();
				const currentLine = editor.getLine(cursor.line);
				let start = cursor.ch;
				let end = start;
				//regex for matching keywords
				const regex=/[\w.]/;
				while (end < currentLine.length && regex.test(currentLine.charAt(end))) ++end;
				while (start && regex.test(currentLine.charAt(start - 1))) --start;
				const current = start !== end && currentLine.slice(start, end);
				//return hints from original function or emptylist
				const result = {list: []};
				result.to=CodeMirror.Pos(cursor.line, end);
				result.from=CodeMirror.Pos(cursor.line, start);
				//push our matching keywords into hint list
				keyWords.forEach(h=>{if (h.startsWith(current)) result.list.push(h);});
				//removes duplicates
				result.list = [...new Set(result.list)];
				//sort list
				result.list.sort();
				return result;
		};

		/**
		 * Calls update of information displaying text cursor location when text cursor moves.
		 */
		this.cm.on("cursorActivity", this.updateInfo)

		/**
		 * Calls update of contents of tabs on keyups so we dont have to have new instance for each tab.
		 */
		this.cm.on("keyup", this.updateContents)

		this.updateInfo()
		let saved_theme = window.localStorage.getItem('sparqleditor_theme')
		this.changeTheme(JSON.parse(saved_theme) || {name: 'cobalt', code: 'cobalt'})
		let saved_fontsize = window.localStorage.getItem('sparqleditor_fontSize')
		this.changeFontSize(JSON.parse(saved_fontsize) || {name: '12px', code: 12})
		let saved_contents = window.localStorage.getItem('sparqleditor_contents')
		this.contents = JSON.parse(saved_contents) || ['PREFIX a: <http://www.w3.org/2000/10/annotation-ns#>\nPREFIX dc: <http://purl.org/dc/elements/1.1/>\nPREFIX foaf: <http://xmlns.com/foaf/0.1/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n # Comment!\n SELECT ?given ?family\nWHERE {\n{\n?annot a:annotates <http://www.w3.org/TR/rdf-sparql-query/> .\n?annot dc:creator ?c .\nOPTIONAL {?c foaf:givenName ?given ;\nfoaf:familyName ?family }\n} UNION {\n?c !foaf:knows/foaf:knows? ?thing.\n?thing rdfs\n} MINUS {\n?thing rdfs:label "剛柔流"@jp\n}\nFILTER isBlank(?c)\n}\n']
		let saved_tabs = window.localStorage.getItem('sparqleditor_tabs')
		this.tabs_list = JSON.parse(saved_tabs) || [{label: 'Main'}]
		this.cm.setValue(this.contents[0])
	},
	methods: {

		getCode(){
			return this.contents[this.tabSelected]
		},

		/**
		 * Updates information displaying line and column number.
		 */
		updateInfo() {
			const cursor = this.cm.getCursor();
			this.currentLineNumber = cursor.line + 1;
			this.currentColNumber = cursor.ch;
		},

		/**
		 * Updates Contents array for current tab with code value.
		 */
		updateContents() {
			this.contents[this.tabSelected] = this.cm.getValue()
			console.log(this.contents)
			window.localStorage.setItem('sparqleditor_contents', JSON.stringify(this.contents));
		},

		/**
		 * Adds new tab of code.
		 */
		async addTab(){
			this.tabsAmount += 1;
			this.tabs_list.push({label: 'Tab ' + this.tabsAmount})
			this.contents.push('')
			await nextTick()
			let cmColor = window.getComputedStyle(document.querySelector('.CodeMirror'), null).getPropertyValue('color')
			document.querySelectorAll('.p-tabview .p-tabview-nav li .p-tabview-nav-link').forEach(element => element.style.color = cmColor)
			document.querySelectorAll('.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link').forEach(element => element.style.color = cmColor)
			window.localStorage.setItem('sparqleditor_contents', JSON.stringify(this.contents));
			window.localStorage.setItem('sparqleditor_tabs', JSON.stringify(this.tabs_list));
		},

		deleteTab(){
			if(this.tabsAmount > 1 && this.tabSelected != 0){
				this.contents.splice(this.tabSelected, 1)
				this.tabs_list.splice(this.tabSelected, 1)
				this.tabsAmount -= 1
				this.tabSelected = 0
				this.cm.setValue(this.contents[this.tabSelected])
				window.localStorage.setItem('sparqleditor_contents', JSON.stringify(this.contents));
				window.localStorage.setItem('sparqleditor_tabs', JSON.stringify(this.tabs_list));
			}
		},

		insertEntryGroup(entries){
			entries.data.forEach(entry => {
				this.insertEntry(entry)
			})
		},

		insertEntry(entry){
			let newEntry = "PREFIX " + entry.namespace + ": <" + entry.uri + ">\n"
			this.cm.setValue(newEntry + this.cm.getValue())
		},

		/**
		 * Changes theme based on emit from PreferencesDialog component.
		 */
		changeTheme(theme){
			//change theme
			this.cm.setOption("theme", theme.code)

			//get CodeMirror styles
			let cmBg = window.getComputedStyle(document.querySelector('.CodeMirror'), null).getPropertyValue('background')
			let cmColor = window.getComputedStyle(document.querySelector('.CodeMirror'), null).getPropertyValue('color')

			//set editor_bar
			document.querySelector('.editor_bar').style.background = cmBg
			document.querySelectorAll('.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link .p-menuitem-text').forEach(element => element.style.color = cmColor)
			document.querySelectorAll('.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link .p-menuitem-icon').forEach(element => element.style.color = cmColor)

			//tab menu
			document.querySelector('.p-tabview').style.background = cmBg
			document.querySelectorAll('.p-tabview .p-tabview-nav li .p-tabview-nav-link').forEach(element => element.style.color = cmColor)
			document.querySelectorAll('.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link').forEach(element => element.style.color = cmColor)

			//set editor footer
			document.querySelector('.editor_footer').style.background = cmBg
			document.querySelector('.editor_footer').style.color = cmColor

			window.localStorage.setItem('sparqleditor_theme', JSON.stringify(theme));
		},

		/**
		 * Changes font size based on emit from PreferencesDialog component.
		 */
		changeFontSize(font_size){
			this.fontSize = font_size.code
			document.querySelector('.CodeMirror').style.fontSize = this.fontSize + 'px';
			window.localStorage.setItem('sparqleditor_fontSize', JSON.stringify(font_size));
		},

		/**
		 * Changes displayed code based on chosen tab.
		 */
		tabChanged(event){
			this.cm.setValue(this.contents[event.index])
		}
	}
}
</script>

<style>
	.CodeMirror {
		height: 100%;
	}

	.p-dropdown .p-dropdown-label.p-placeholder{
		padding: 0.4rem;
	}

	.p-dropdown .p-inputtext{
		padding: 0.4rem;
	}

	.p-button {
		margin: 0.3rem .5rem;
		min-width: 10rem;
	}

	.p-tabview-panels {
		display: none;
	}

	p {
		margin: 0;
	}

	.confirmation-content {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.p-dialog .p-button {
		min-width: 6rem;
	}

	.editor_bar {
		height: 4vh;
		border-bottom: 1px solid #ddd !important;
	}

	.main {
		height: 85vh;
	}

	.editor_footer {
		border-top: 1px solid #ddd;
		font-family: monospace;
	}

	.p-menuitem {
		z-index: 10;
	}

	.table-header {
	display: flex;
	align-items: center;
	justify-content: space-between;

	@media screen and (max-width: 960px) {
		align-items: start;
	}
}

.confirmation-content {
	display: flex;
	align-items: center;
	justify-content: center;
}

@media screen and (max-width: 960px) {
	::v-deep(.p-toolbar) {
		flex-wrap: wrap;
	}
	
	.p-button {
		margin-bottom: 0.25rem;
	}
}

</style>