import React from 'react';
import PropTypes from 'prop-types';
import {observer} from 'mobx-react';
import {FaArrowLeft} from 'react-icons/fa';
import Sankey from './Sankey';
import SynsetGraph from './SynsetGraph';
import LUMatchingGraph from './LUMatchingGraph';

import './ChartPanel.css';

import AlignmentStore from '../stores/AlignmentStore';
import UiState from '../stores/UiState';

/**
 * A component for the primary viewport of the application. It is responsible
 * for controlling which visualization will be rendered based on the UI state.
 */
const ChartPanel = observer(
	class ChartPanel extends React.Component {
		static propTypes = {
			/**
			 * A mobx store of frame alignments.
			 */
			store: PropTypes.instanceOf(AlignmentStore),
			/**
			 * A mobx store for the application's UI state.
			 */
			uiState: PropTypes.instanceOf(UiState),
		}

		constructor() {
			super();
			this.selectableTypes = [
				"lu_wordnet",
				"synset",
				"synset_inv",
				"lu_muse"
			]
		}

		/**
		 * Handles click on "Back" button/arrow.
		 * 
		 * @public
		 * @method
		 */
		onBackClick() {
			this.props.uiState.isAlignmentDetailVisible = false;
		}

		/**
		 * Handles click on a edge/link of the Sankey diagram.
		 * 
		 * @public
		 * @method
		 * @param {Object} source edge's source frame object.
		 * @param {Object} target edge's target frame object.
		 */
		onEdgeClick(source, target) {
			const {uiState} = this.props;
			
			if (this.selectableTypes.indexOf(uiState.scoring.type) > -1) {
				uiState.isAlignmentDetailVisible = true;
				uiState.selectEdge(source.gid, target.gid);
			}
		}

		render() {
			const {store, uiState} = this.props;
			let className = "";

			// Determining the tranformation that must be done to show the correct chart.
			className += uiState.isAlignmentDetailVisible ? "shift" : "no-shift";
			if (!uiState.isSidebarOpen) className += " expanded";
		
			return (
				<div
					id="chart-panel-container"
					className={className} >
					{
						uiState.isAlignmentDetailVisible &&
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
							? <LUMatchingGraph store={store} />
							: <SynsetGraph store={store} />
					}
				</div>
			)
		}
	}
)

export default ChartPanel;