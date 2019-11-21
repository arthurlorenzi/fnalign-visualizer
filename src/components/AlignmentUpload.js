import React from 'react';

class AlignmentUpload extends React.Component {
	onFileChange = event => {
		const file = event.target.files[0];

		if (file) {
			const reader = new FileReader();

			reader.addEventListener('load', e => {
				// TODO: show error messsage in case something bad happens
				this.props.store.raw = JSON.parse(e.target.result);
			});

			reader.readAsBinaryString(file);
		}
	}

	render() {
		return (<input type="file" onChange={this.onFileChange} />)
	}
}

export default AlignmentUpload;
