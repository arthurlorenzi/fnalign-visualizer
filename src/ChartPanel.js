import React from 'react';
import {observer} from 'mobx-react';
import {FaArrowLeft} from 'react-icons/fa';
import Sankey from './components/Sankey';
import SynsetGraph from './components/SynsetGraph';
import TranslationGraph from './components/TranslationGraph';

import './ChartPanel.css';

const ChartPanel = observer(
	class ChartPanel extends React.Component {

		selectableTypes = [
			"lu_wordnet",
			"synset",
			"synset_inv",
			"lu_muse"
		]

		onBackClick() {
			this.props.uiState.showAlignmentDetails = false;
		}

		onEdgeClick(source, target) {
			const {uiState} = this.props;
			
			if (this.selectableTypes.indexOf(uiState.scoring.type) > -1) {
				uiState.showAlignmentDetails = true;
				uiState.selectEdge(source.gid, target.gid);
			}
		}

		render() {
			const {store, uiState} = this.props;
			let className = "";

			className += uiState.showAlignmentDetails ? "shift" : "no-shift";
			if (!uiState.sidebarOpen) className += " expanded";
		
			return (
				<div
					id="chart-panel-container"
					className={className} >
					{
						uiState.showAlignmentDetails &&
						<div id="back-button-container" onClick={() => this.onBackClick()} >
							<FaArrowLeft size="1.75em" />
						</div>
					}
					<Sankey
						store={store}
						onEdgeClick={(s, t) => this.onEdgeClick(s, t)}
					/>
					{
						uiState.scoring && uiState.scoring.type === 'lu_muse'
							? <TranslationGraph store={store} />
							: <SynsetGraph store={store} />
					}
				</div>
			)
		}
	}
)

export default ChartPanel;