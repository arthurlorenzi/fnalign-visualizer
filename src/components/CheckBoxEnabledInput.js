import React from 'react';

import CheckBox from './CheckBox';
import './CheckBoxEnabledInput.css';

export default props => {
	const {
		checked,
		value,
		label,
		placeholder,
		min,
		onCheckedChange,
		onValueChange,
	} = props;
		
	return (
		<div className="checkbox-enable-input-wrapper">
			<CheckBox
				checked={checked}
				onChange={onCheckedChange}
				label={label}
			/>
			<div className="checkbox-enabled-input-input-wrapper">
				<input
					type="number"
					value={value}
					onChange={e => onValueChange(Number(e.target.value))}
					min={min}
					placeholder={placeholder}
					disabled={!checked}
				/>
			</div>
		</div>
	);
};
