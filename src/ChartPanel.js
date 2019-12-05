import React from 'react';
import {observer} from 'mobx-react';
import {FaArrowLeft} from 'react-icons/fa';
import Sankey from './components/Sankey';
import SynsetGraph from './components/SynsetGraph';

import './ChartPanel.css';

const ChartPanel = observer(
	class ChartPanel extends React.Component {

		onBackClick() {
			this.props.store.showDetails = false;
		}

		render() {
			const {store, uiState} = this.props;
			let className = "";

			className += store.showDetails ? "shift" : "no-shift";
			if (!uiState.sidebarOpen) className += " expanded";
		
			return (
				<div
					id="chart-panel-container"
					className={className} >
					{
						store.showDetails &&
						<div id="back-button-container" onClick={() => this.onBackClick()} >
							<FaArrowLeft size="1.75em" />
						</div>
					}
					<Sankey store={store} />
					<SynsetGraph store={store} />
				</div>
			)
		}
	}
)

export default ChartPanel;