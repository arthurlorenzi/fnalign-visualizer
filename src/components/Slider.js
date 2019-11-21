import React from 'react';
import { observer } from 'mobx-react';

import './Slider.css';

export default observer(props => {
	const {store} = props;

	return (
		<div className="slider-container">
			<input
				type="range"
				min={0}
				max={1}
				step={0.0005}
				value={store.threshold}
				onChange={e => store.threshold = +e.target.value}
				className="slider" />
			<input
				type="number"
				min={0}
				max={1}
				step="any"
				value={store.threshold}
				onChange={e => store.threshold = +e.target.value}
				className="slider-text" />
		</div>
	)
})