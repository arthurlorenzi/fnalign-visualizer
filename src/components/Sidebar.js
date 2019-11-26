import React from 'react';
import MultiSelect from "@kenshooui/react-multi-select";
import { observer } from 'mobx-react';

import './Sidebar.css';
import AlignmentUpload from './AlignmentUpload';
import Slider from './Slider';

export default observer(props => {
	const {store} = props;

	return (
		<div className="sidebar-container">
			<h2>Alignment file</h2>
			<AlignmentUpload store={store} />
			<h2>Score threshold</h2>
			<Slider store={store} />
			<h2>Frames</h2>
			<MultiSelect
				items={store.frames}
				onChange={selected => store.sankeyFrames = selected}
				itemHeight={30}
				wrapperClassName="multi-select-wrapper"
			/>
			<p>{store.selectedEdge[0]}</p>
			<p>{store.selectedEdge[1]}</p>
		</div>
	);
})