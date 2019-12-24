import React from 'react';

import CheckBox from './CheckBox';
import './CheckBoxEnabledInput.css';

class CheckBoxEnabledInput extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			enabled: false,
			textValue: "",
		};
	}

	onCheckedChange = checked => {
		this.setState({ enabled: checked });
		this.props.onCheckedChange(checked, Number(this.state.textValue));
	}

	onInputChange = event => {
		const {value} = event.target;
		this.setState({ textValue: value });
		this.props.onValueChange(Number(value));
	}

	render() {
		const {label, placeholder, min} = this.props;
		const {enabled, textValue} = this.state;
		
		return (
			<div className="checkbox-enable-input-wrapper">
				<CheckBox
					onChange={this.onCheckedChange}
					label={label}
				/>
				<div className="checkbox-enabled-input-input-wrapper">
					<input
						type="number"
						value={textValue}
						onChange={this.onInputChange}
						min={min}
						placeholder={placeholder}
						disabled={!enabled}
					/>
				</div>
			</div>
		);
	}

}

export default CheckBoxEnabledInput;