import React from 'react';

import './AlignmentUpload.css';

class AlignmentUpload extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			error: false,
		}
	}

	onFileChange = event => {
		const file = event.target.files[0];

		if (file) {
			const reader = new FileReader();

			reader.addEventListener('load', e => {
				let error = false;
				const {store} = this.props;
				try {
					store.load(JSON.parse(e.target.result));
				} catch (exception) {
					console.log(exception);
					error = true;
				}
				this.setState({ error })
			});

			reader.readAsBinaryString(file);
		}
	}

	renderError() {
		const {error} = this.state;
		return error ? <p className="upload-error">Error reading input file.</p> : null;
	}

	render() {
		return (
			<div>
				<input type="file" onChange={this.onFileChange} />
				{this.renderError()}
			</div>
		);
	}
}

export default AlignmentUpload;
