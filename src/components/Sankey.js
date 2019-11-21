import React from 'react';
import { select } from 'd3-selection';
import { observer } from 'mobx-react';
// Should redo this d3 layout (it's kinda bad!)
import viz from './viz.js';

import './Sankey.css';

const Sankey = observer(
	class Sankey extends React.Component {

		container = null

		componentDidMount() {
			this.renderSankey();
		}

		componentDidUpdate() {
			this.renderSankey();
		}

		renderSankey() {
			const {store} = this.props;
			const height = window.innerHeight;
			
			const container = select(this.container);
			container.select("svg").remove();
			const svg = container.append("svg").attr("width", 960).attr("height", height-10);
			const g = svg.append("g").attr("transform","translate(200,50)");
			
			const bp =
				viz.bP()
					.data(store.data)
					.min(12)
					.pad(1)
					.height(height-200)
					.width(500)
					.fill(() => "#3F51B5")
			
			g.call(bp);

			g.selectAll(".mainBars").append("text").attr("class","label")
				.attr("x", d => (d.part === "primary" ? -30 : 30))
				.attr("y", () => 6)
				.text(d => d.key)
				.attr("text-anchor", d => (d.part === "primary" ? "end": "start"));
		}

		render() {
			const data = this.props.store.data; // need this reference to properly react

			if (data.length === 0 ) {
				return <h3 className="no-data-text">No data to show.</h3>
			} else {
				return (<div ref={node => this.container = node}></div>);
			}
		}
	}
);

export default Sankey;