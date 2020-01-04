import { action, computed, 	decorate, observable } from "mobx"

class UiState {

	sidebarOpen = true

	showAlignmentDetails = false

	scoring = null

	scoringOptions = []

	sankeyFrames = []

	selectedEdge = [null, null]

	get scoringSelectOptions() {
		return this.scoringOptions.map(x => ({ value: x.id, label: x.desc }));
	}

	setScoring(id) {
		this.scoring = this.scoringOptions.find(x => x.id === id);
	}

	selectEdge = action((source, target) => {
		this.selectedEdge[0] = source;
		this.selectedEdge[1] = target;
	})

}

decorate(UiState, {
	sidebarOpen: observable,
	showAlignmentDetails: observable,
	scoring: observable,
	scoringOptions: observable,
	sankeyFrames: observable,
	selectedEdge: observable,
	scoringSelectOptions: computed,
});

export default UiState;