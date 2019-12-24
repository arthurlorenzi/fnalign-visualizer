import React from 'react';
import Select from 'react-select';
import MultiSelect from "@kenshooui/react-multi-select";
import { FaBars } from 'react-icons/fa';
import { observer } from 'mobx-react';

import './Sidebar.css';

import AlignmentUpload from './AlignmentUpload';
import CheckBox from './CheckBox';
import CheckBoxEnabledInput from './CheckBoxEnabledInput';
import Slider from './Slider';

export default observer(props => {
	const {store, uiState} = props;
	const style = { width: uiState.sidebarOpen ? '500px' : '60px' };
	const display = { display: uiState.sidebarOpen ? 'block' : 'none' };

	return (
		<div className="sidebar-container" style={style} >
			<div className="sidebar-icon-container">
				<div
					onClick={() => uiState.sidebarOpen = !uiState.sidebarOpen}
					className="siderbar-icon-click-wrapper"
				>
					<FaBars size="1.75em" color="#3F51B5" />
				</div>
			</div>
			<div style={display} >
				<h3 className="sidebar-field-label first">Alignment file</h3>
				<AlignmentUpload store={store} />
				<div className="sidebar-row">
					<div>
						<h3 className="sidebar-field-label">Scoring tecnique</h3>
						<Select
							options={store.scoringOptions}
							onChange={o => store.selectAlignment(o.value)}
						/>
					</div>
					<div>
						<h3 className="sidebar-field-label">Threshold</h3>
						<Slider store={store} />
					</div>
				</div>
				<div className="sidebar-row">
					<div>
						<CheckBoxEnabledInput
							onCheckedChange={(checked, value) => store.sankeyEdgesMax = checked ? value : Infinity}
							onValueChange={value => store.sankeyEdgesMax = value}
							min={1}
							label="Restrict number of connections of each frame:"
							placeholder="Max # of edges for frame"
						/>
					</div>
					<div>
						<CheckBox
						onChange={checked => store.strictSankeySet = checked}
						label="Show ONLY selected frames"/>
					</div>
				</div>
				<h3 className="sidebar-field-label">Frame selection</h3>
				<MultiSelect
					items={store.frameOptions}	
					selectedItems={store.sankeyFrames}
					onChange={selected => store.sankeyFrames = selected}
					itemHeight={30}
					wrapperClassName="multi-select-wrapper"
				/>
			</div>
		</div>
	);
});
