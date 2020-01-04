import React from 'react';
import { observer } from 'mobx-react';

import './Slider.css';

export default observer(props => {
	const {value, onChange} = props;

	return (
		<div className="slider-container">
			<input
				type="range"
				min={0}
				max={1}
				step={0.001}
				value={value}
				onChange={e => onChange(+e.target.value)}
				className="slider" />
			<input
				type="number"
				min={0}
				max={1}
				step="any"
				value={value}
				onChange={e => onChange(+e.target.value)}
				className="slider-text" />
		</div>
	)
})