import React from 'react';

import "@kenshooui/react-multi-select/dist/style.css"
import './App.css';

import Sidebar from './components/Sidebar';
import AlignmentStore from './stores/AligmentStore';
import UiState from './stores/UiState';
import ChartPanel from './ChartPanel';

const store = new AlignmentStore();
const uiState = new UiState();

function App() {
	return (
		<div className="App">
			<Sidebar store={store} uiState={uiState} />
			<div className="app-body">
				<ChartPanel store={store} uiState={uiState} />
			</div>
		</div>
	);
}

export default App;
