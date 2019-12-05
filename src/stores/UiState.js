import { decorate, observable } from "mobx"

class UiState {

	sidebarOpen = true

}

decorate(UiState, {
	sidebarOpen: observable,
});

export default UiState;