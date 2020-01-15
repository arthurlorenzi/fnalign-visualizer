import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import MultiSelect from "@kenshooui/react-multi-select";
import { FaBars } from 'react-icons/fa';
import { observer } from 'mobx-react';

import './Sidebar.css';

import JsonFileInput from './JsonFileInput';
import CheckBox from './CheckBox';
import CheckBoxEnabledInput from './CheckBoxEnabledInput';
import Slider from './Slider';

import AlignmentStore from '../stores/AlignmentStore';
import UiState from '../stores/UiState';

/**
 * 
 * A Sidebar component for the alignment visualization tool. This sidebar
 * renders the components necessary to input alignment json files and change
 * visualization parameters.
 * 
 */
const Sidebar = observer(
	class Sidebar extends React.Component {
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

		/**
		 * Handles an alignment file. All parsed data is loaded to the
		 * AlignmentStore instance.
		 * 
		 * @public
		 * @method
		 * @param {Object} data parsed data from an alignment file.
		 */
		onFileChange = data => this.props.store.load(data)

		/**
		 * Handles the selection of a scoring option.
		 * 
		 * @public
		 * @method
		 * @param {Object} option the selected scoring option.
		 */
		onScoringChange = option => this.props.uiState.setScoring(option.value)

		/**
		 * Handles changes in frame selection for the visualization.
		 * 
		 * @public
		 * @method
		 * @param {Array} selected list of selected frames.
		 */
		onFrameSelectionChange = selected => this.props.uiState.sankeyFrames = selected

		/**
		 * Updates a property in the params object of the current scoring of the
		 * UiState instance.
		 * 
		 * @public
		 * @method
		 * @param {string} param the parameter propery name
		 * @param {*} value the new value for the parameter.
		 */
		updateParam = (param, value) => {
			const {uiState} = this.props;
			if (uiState.scoring) {
				uiState.scoring.params[param] = value;
			}
		}

		/**
		 * Handles change in visualization score threshold.
		 * 
		 * @public
		 * @method
		 * @param {number} value the new threshold value.
		 */
		onThresholdChange = value => this.updateParam("threshold", value)

		/**
		 * Handles change in checkbox "Restrict number of connections of each frame".
		 * 
		 * @public
		 * @method
		 * @param {boolean} checked whether the checkbox is checked. 
		 */
		onLimitSankeyEdgesChange = checked => this.updateParam("limitSankeyEdges", checked)

		/**
		 * Handles change in maximum number of edges displayed in the Sankey diagram.
		 * 
		 * @public
		 * @method
		 * @param {number} value a integer edge limit for each frame.
		 */
		onSankeyEdgesMaxChange = value => this.updateParam("sankeyEdgesMax", value)

		/**
		 * Handles change on checkbox "Show ONLY selected frames".
		 * 
		 * @public
		 * @method
		 * @param {boolean} checked whether the checkbox is checked. 
		 */
		onDisplayOnlyFrameSetChange = checked => this.updateParam("displayOnlyFrameSet", checked)
		
		render() {
			const {store, uiState} = this.props;
			const sidebarWidth = { width: uiState.isSidebarOpen ? '500px' : '60px' };
			const contentDisplay = { display: uiState.isSidebarOpen ? 'block' : 'none' };
			const params = uiState.scoring ? uiState.scoring.params : {}; 
		
			return (
				<div className="sidebar-container" style={sidebarWidth} >
					<div className="sidebar-icon-container">
						<div
							onClick={() => uiState.isSidebarOpen = !uiState.isSidebarOpen}
							className="siderbar-icon-click-wrapper"
						>
							<FaBars size="1.75em" color="#3F51B5" />
						</div>
					</div>
					<div style={contentDisplay} >
						<h3 className="sidebar-field-label first">Alignment file</h3>
						<JsonFileInput onFileChange={this.onFileChange} />
						<div className="sidebar-row">
							<div>
								<h3 className="sidebar-field-label">Scoring tecnique</h3>
								<Select
									options={uiState.scoringSelectOptions}
									onChange={this.onScoringChange}
								/>
							</div>
							<div>
								<h3 className="sidebar-field-label">Threshold</h3>
								<Slider
									value={params.threshold}
									onChange={this.onThresholdChange}
								/>
							</div>
						</div>
						<div className="sidebar-row">
							<div>
								<CheckBoxEnabledInput
									checked={params.limitSankeyEdges}
									value={params.sankeyMaxEdges}
									onCheckedChange={this.onLimitSankeyEdgesChange}
									onValueChange={this.onSankeyEdgesMaxChange}
									min={1}
									label="Restrict number of connections of each frame:"
									placeholder="Max # of edges for frame"
								/>
							</div>
							<div>
								<CheckBox
									checked={params.displayOnlyFrameSet}
									onChange={this.onDisplayOnlyFrameSetChange}
									label="Show ONLY selected frames"
								/>
							</div>
						</div>
						<h3 className="sidebar-field-label">Frame selection</h3>
						<MultiSelect
							items={store.frameOptions}	
							selectedItems={uiState.sankeyFrames}
							onChange={this.onFrameSelectionChange}
							itemHeight={30}
							wrapperClassName="multi-select-wrapper"
						/>
					</div>
				</div>
			);
		}
	}
);

export default Sidebar;