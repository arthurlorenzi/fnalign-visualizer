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

		container = null

		componentDidMount() {
			this.renderSankey();
		}

		componentDidUpdate() {
			this.renderSankey();
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
			const scoreFormatter = format(".3f");
			const height = window.innerHeight;
			const container = select(this.container);

			container.select("svg").remove();
			const svg = container.append("svg").attr("width", 960).attr("height", height-10);
			const g = svg.append("g").attr("transform","translate(200,50)");
			
			const bP =
				viz.bP()
					.data(store.data)
					.min(12)
					.pad(1)
					.height(height-200)
					.width(500)
					.fill(d => colorMap[d.primary])
			
			const bPg = g.call(bP);

			bPg.selectAll(".mainBars")
				.on("mouseover", sel => {
					const filterFn =
						sel.part === "primary"
							? (d => sel.key === d.primary)
							: (d => sel.key === d.secondary);

					bP.mouseover(sel);
					bPg.selectAll(".score")
						.filter(filterFn)
						.text(d => scoreFormatter(d.value))
				})
				.on("mouseout", sel => {
					bP.mouseout(sel);
					bPg.selectAll(".score").text("")
				});

			bPg
				.selectAll(".subBars")
				.filter(d => d.part === "secondary")
				.append("text")
					.attr("class", "score")
					.attr("x", -58)
					.attr("y", 6)
			
			g.selectAll(".mainBars").append("text").attr("class","label")
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
				return (<div ref={node => this.container = node}></div>);
			}
		}
	}
);

export default Sankey;