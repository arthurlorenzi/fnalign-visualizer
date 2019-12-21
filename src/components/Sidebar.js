import React from 'react';
import Select from 'react-select';
import MultiSelect from "@kenshooui/react-multi-select";
import { FaBars } from 'react-icons/fa';
import { observer } from 'mobx-react';

import './Sidebar.css';
import AlignmentUpload from './AlignmentUpload';
import Slider from './Slider';

export default observer(props => {
	const {store, uiState} = props;
	const style = { width: uiState.sidebarOpen ? '550px' : '60px' };
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
				<h2>Alignment file</h2>
				<AlignmentUpload store={store} />
				<h2>Scoring method</h2>
				<Select
					options={store.scoringOptions}
					onChange={o => store.selectAlignment(o.value)}
				/>
				<h2>Score threshold</h2>
				<Slider store={store} />
				<h2>Frames</h2>
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
