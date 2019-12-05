import { decorate, observable } from "mobx"

class UiState {

	sidebarOpen = true

	showAlignmentDetails = false

}

decorate(UiState, {
	sidebarOpen: observable,
	showAlignmentDetails: observable,
});

export default UiState;