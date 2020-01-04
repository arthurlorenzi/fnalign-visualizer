import React from 'react';

import './CheckBox.css';

export default props => {
	return (
		<div className="checkbox-wrapper">
			<input type="checkbox" checked={props.checked} onChange={e => props.onChange(e.target.checked)} />
			<span>{props.label}</span>
		</div>
	)
};