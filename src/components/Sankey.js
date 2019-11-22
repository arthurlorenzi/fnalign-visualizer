import React from 'react';
import { format } from 'd3-format';
import { select } from 'd3-selection';
import { observer } from 'mobx-react';
// TODO: Should redo this d3 layout (it's kinda bad!)
import viz from './viz.js';

import './Sankey.css';

const colors = function*() {
	const colors = [
		"#3366CC",
		"#DC3912",
		"#FF9900",
		"#109618",
		"#990099",
		"#0099C6"
	];
	let index = 0;

	while(true) {
		yield colors[index];
		index = ++index % colors.length;
	}
};

const Sankey = observer(
	class Sankey extends React.Component {

		root = null

		selection = null

		scoreFormatter = format(".3f")

		bP = null

		bPg = null

		componentDidMount() {
			this.renderSankey();
		}

		componentDidUpdate() {
			this.renderSankey();
		}

		onBarClick(bar) {
			if (this.selection && this.selection.key === bar.key) {
				this.unselect(this.selection);
				this.selection = null;
			} else {
				if (this.selection) {
					this.unselect(this.selection);
				}
				this.selection = bar;
				this.select(bar);
			}
		}

		onEdgeClick(edge) {
			const {store} = this.props;

			store.selectedAlignment[0] = edge.primary;
			store.selectedAlignment[1] = edge.secondary;
		}

		select(bar) {
			const filterFn =
				bar.part === "primary"
					? (d => bar.key === d.primary)
					: (d => bar.key === d.secondary);

			this.bP.mouseover(bar);
			this.bPg.selectAll(".score")
				.filter(filterFn)
				.text(d => this.scoreFormatter(d.value))
		}

		unselect(bar) {
			this.bP.mouseout(bar);
			this.bPg.selectAll(".score").text("");
		}

		renderSankey() {
			const {store} = this.props;
			const colorGen = colors();
			const colorMap =
				[...new Set(store.data.map(x => x[0]))]
					.reduce((res, current) => {
						res[current] = colorGen.next().value;
						return res;
					}, {});
			const height = window.innerHeight;
			const root = select(this.root);

			root.select("svg").remove();
			const svg = root.append("svg").attr("width", 960).attr("height", height-10);
			const g = svg.append("g").attr("transform","translate(200,50)");
			
			this.bP =
				viz.bP()
					.data(store.data)
					.min(12)
					.pad(1)
					.height(height-200)
					.width(500)
					.fill(d => colorMap[d.primary])
			
			this.bPg = g.call(this.bP);

			this.bPg.selectAll(".mainBars")
				.on("click", d => this.onBarClick(d));
			
			this.bPg.selectAll(".edges")
				.on("click", d => this.onEdgeClick(d));

			this.bPg.selectAll(".subBars")
				.filter(d => d.part === "secondary")
				.append("text")
					.attr("class", "score")
					.attr("x", -58)
					.attr("y", 6)
			
			this.bPg.selectAll(".mainBars")
				.append("text")
					.attr("class","label")
					.attr("x", d => (d.part === "primary" ? -30 : 30))
					.attr("y", () => 6)
					.text(d => d.key)
					.attr("text-anchor", d => (d.part === "primary" ? "end": "start"));
		}

		render() {
			const data = this.props.store.data;

			if (data.length === 0 ) {
				return <h3 className="no-data-text">No data to show.</h3>
			} else {
				return (<div ref={node => this.root = node}></div>);
			}
		}
	}
);

export default Sankey;