import React from 'react';
import PropTypes from 'prop-types';
import {observer} from 'mobx-react';
import {format} from 'd3-format';
import {select} from 'd3-selection';
import {scalePoint} from 'd3-scale';

import './LUMatchingGraph.css';

import AlignmentStore from '../stores/AlignmentStore';

const scoreFormatter = format(".3f");

/**
 * A component for lexical unit matching graphs.
 */
const LUMatchingGraph = observer(
	class LUMatchingGraph extends React.Component {
		static propTypes = {
			/**
			 * A mobx store of frame alignments.
			 */
			store: PropTypes.instanceOf(AlignmentStore),
			/**
			 * A callback called when mouse is placed over of the nodes.
			 */
			onMouseOverNode: PropTypes.func,
			/**
			 * A callback called when mouse is leaves of the nodes.
			 */
			onMouseOutNode: PropTypes.func,
		}

		constructor() {
			super();
			this.root = null;
			this.links = null;
			this.nodes = null;
			this.height = null;
			this.width = null;
			this.margin = null;
		}

		/**
		 * Manually invokes D3.js rendering function when the component is mounted.
		 * 
		 * @public
		 * @method
		 */
		componentDidMount() {
			this.renderGraph();
		}

		/**
		 * Manually invokes D3.js rendering function when the component is updated.
		 * 
		 * @public
		 * @method
		 */
		componentDidUpdate() {
			this.renderGraph();
		}

		/**
		 * Gets all required data for rendering. Basic node and link data comes
		 * from the store received from props, this method computes the coordinates
		 * where each element should be rendered.
		 * 
		 * @public
		 * @method
		 * @returns {Object} Graph definition with a node list and a link list.
		 */
		getRenderingData() {
			const {store} = this.props;
			const data = store.graphData;
			
			const x =
				scalePoint()
					.domain(['frm1LU', 'intermediate', 'frm2LU'])
					.range([0, this.width])
					.padding(.3)

			const yLU1 = scalePoint()
				.domain(data.nodes
					.filter(d => d.type === 'frm1LU')
					.sort((a, b) => b.outDegree - a.outDegree)
					.map(d => d.name))
				.range([this.margin*2, this.height-(this.margin*2)]);

			const yLU2 = scalePoint()
				.domain(data.nodes
						.filter(d => d.type === 'frm2LU')
						.sort((a,b) => b.outDegree - a.outDegree)
						.map(d => d.name))
				.range([this.margin*2, this.height-(this.margin*2)]);

			const yInter = scalePoint()
				.domain(data.nodes
					.filter(d => d.type === 'intermediate')
					.sort((a, b) => b.inDegree - a.inDegree)
					.map(d => d.name))
				.range([this.margin, this.height-this.margin]);

			const frm1LUX = x('frm1LU');
			const frm2LUX = x('frm2LU');
			const interX = x('intermediate');

			data.nodes.forEach(d => {
				if (d.type === 'frm1LU') {
					d.x = frm1LUX;
					d.y = yLU1(d.name);
				} else if (d.type === 'frm2LU') {
					d.x = frm2LUX;
					d.y = yLU2(d.name);
				} else {
					d.x = interX;
					d.y = yInter(d.name);
				}
			})

			return {
				nodes: data.nodes,
				links: data.links
			}
		}

		/**
		 * Computes the path string for the path element of the given link data.
		 * 
		 * @public
		 * @method
		 * @param {Object} datum Link data object.
		 * @returns {string} A string of path commands.
		 */
		computePath(datum) {
			let coef;
			let x1 = datum.source.x;
			let y1 = datum.source.y - (datum.source.height/4);
			let x2 = datum.target.x;
			let y2 = datum.target.y - (datum.target.height/4);

			if (datum.source.type === 'frm1LU' || datum.source.type === 'intermediate') {
				x1 += datum.source.width + 12;
				x2 -= 12;
				coef = 1;
			} else {
				x1 -= 12;
				x2 += datum.target.width + 16;
				coef = -1;
			}

			const offset = 15;
			const ccoef = (Math.abs(x1 - x2)-2*offset)/2.5;

			return `
				M ${x1}            ${y1}
				L ${x1 + 3*coef}   ${y1}
				C ${x1+ccoef*coef} ${y1}, ${x2-ccoef*coef} ${y2}, ${x2+offset*-coef} ${y2}
				L ${x2}            ${y2}
			`;
		}

		/**
		 * Renders the graph footer that shows the frame names and the alignment
		 * score of the pair.
		 * 
		 * @public
		 * @method
		 * @param {Object} data Graph data object as returned by getRenderingData.
		 */
		includeFooter(data) {
			const {store, framePair} = this.props;
			const svg = select(this.root).select("svg");
			const matching = data.nodes.filter(d => d.isMatchingNode).length;
			const reference = data.nodes.filter(d => d.isReferenceNode && !d.isMatchingNode).length;
			
			if (store.frames[framePair[0]] && store.frames[framePair[1]]) {
				const right = store.frames[framePair[0]];
				const left = store.frames[framePair[1]];

				svg.select("#title")
				.attr("x", this.margin)
				.attr("y", this.height-this.margin/2)
				.attr("class", "graph-info")
				.text(`Frames: ${right.name} (${right.gid}), ${left.name} (${left.gid})`)

				svg.select("#stats")
					.attr("x", this.width)
					.attr("y", this.height-this.margin/2)
					.attr("class", "graph-info graph-score")
					.html(`
						Alignment score:
						<tspan class="match">${matching}</tspan>
						÷
						(
						<tspan class="match">${matching}</tspan>
						+
						<tspan class="reference">${reference}</tspan>
						)
						= ${scoreFormatter(matching/(matching + reference))}`)
			}
		}

		/**
		 * Renders the matching graph using D3.js and sets up DOM events for its
		 * elements. This rendering should be controlled by D3.js and not ReactJS.
		 * This guarantees that the diagram will not be part of React's virtual
		 * DOM, thus preventing the framework from interfering with elements
		 * created by the library (D3.js).
		 * 
		 * @public
		 * @method
		 */
		renderGraph() {
			this.height = window.innerHeight-10;
			this.width = 960;
			this.margin = 60;

			const data = this.getRenderingData();
			const svg = select(this.root).select("svg");

			svg
				.attr("height", this.height)
				.attr("width", this.width);

			this.nodes = svg.select("#nodes")
				.selectAll("text")
				.data(data.nodes)
				.join("text")
					.text(d => d.name)
					.each(function(d) {
						const bbox = this.getBBox();
						d.width = bbox.width;
						d.height = bbox.height + 2;
					})
					.attr("x", d => d.x)
					.attr("y", d => d.y)
					.attr("class", d => {
						let name = "node";
						if (d.isMatchingNode) {
							name += " match";
						} else if (d.isReferenceNode) {
							name += " ref";
						}
						return name;
					})
					.attr("opacity", 0.75)
					.on("mouseover", d => this.onMouseOverNode(d))
					.on("mouseout", d => this.onMouseOutNode(d))

			this.links = svg.select("#links")
				.selectAll("path")
				.data(data.links)
				.join("path")
					.attr("d", this.computePath)
					.attr("marker-end", "url(#arrowhead)")
					.attr("stroke", "#555")
					.attr("fill-opacity", 0)
					.attr("opacity", 0.1)

			this.includeFooter(data);
		}

		/**
		 * Handles mouse over node event highlighting the element and its links. It
		 * also invokes the handler of the parent component when it is passed via
		 * props.
		 * 
		 * @public
		 * @method
		 * @param {Object} datum Node data object.
		 */
		onMouseOverNode(datum) {
			const linked = new Set();

			this.links
				.filter(d => d.source === datum || d.target === datum)
				.each(d => {
					linked.add(d.source);
					linked.add(d.target);
				})
				.attr("opacity", 1);

			this.nodes.filter(d => linked.has(d))
				.style("font-weight", "bold")
				.attr("opacity", 1);

			if (this.props.onMouseOverNode)
				this.props.onMouseOverNode(datum, this.nodes, this.links);
		}

		/**
		 * Handles mouse out of node event, removing any highlight that was applied
		 * before and invoking the parent component's handler when it is passed via
		 * props.
		 * 
		 * @public
		 * @method
		 */
		onMouseOutNode() {
			this.links.attr("opacity", 0.1);
			this.nodes
				.style("font-weight", "normal")
				.attr("opacity", 0.75);

			select("#synset-tooltip").style("display", "none");

			if (this.props.onMouseOutNode)
				this.props.onMouseOutNode();
		}

		render() {
			const {store} = this.props;

			return (
				<div ref={node => this.root = node}>
					{
						store.graphData.nodes.length > 0
						?
							<svg>
								<defs>
									<marker id="arrowhead"
										markerWidth="10" markerHeight="7" 
										refX="0" refY="3.5" orient="auto">
										<polygon points="0 0, 10 3.5, 0 7" fill="#555" />
									</marker>
								</defs>
								<g id="nodes" />
								<g id="links" />
								<text id="title" />
								<text id="stats" />
							</svg>
						: <h3 className="no-data-text">No data to show.</h3>
					}
				</div>
			);
		}

	}
);

export default LUMatchingGraph;