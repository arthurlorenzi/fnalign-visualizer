import React from 'react';

import "@kenshooui/react-multi-select/dist/style.css"
import './App.css';

import Sankey from './components/Sankey';
import Sidebar from './components/Sidebar';
import AlignmentStore from './stores/AligmentStore';

const store = new AlignmentStore()

function App() {
	return (
		<div className="App">
			<Sidebar store={store} />
			<div className="App-body">
				<Sankey store={store} />
			</div>
		</div>
	);
}

export default App;
