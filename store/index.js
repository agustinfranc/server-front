export const state = () => ({
  list: [],

  snackbar: {
    display: false,
    text: '',
    color: '',
    timeout: 4000,
  },
})

export const mutations = {
  UPDATE_LIST(state, payload) {
    state.list = payload
  },

  ADD_TO_LIST(state, payload) {
    state.list.push(payload)
  },

  REPLACE_IN_LIST(state, payload) {
    const editedIndex = state.list.findIndex((e) => e.id === payload.id)

    Object.assign(state.list[editedIndex], payload)
  },

  REMOVE_FROM_LIST(state, payload) {
    const editedIndex = state.list.findIndex((e) => e.id === payload.id)

    state.list = state.list.filter((e, i) => i !== editedIndex)
  },

  SET_SNACKBAR(state, payload) {
    state.snackbar = payload
  },
}

export const actions = {
  updateList({ commit }, payload) {
    commit('UPDATE_LIST', payload)
  },

  addToList({ commit }, payload) {
    commit('ADD_TO_LIST', payload)
  },

  replaceInList({ commit }, payload) {
    commit('REPLACE_IN_LIST', payload)
  },

  removeFromList({ commit }, payload) {
    commit('REMOVE_FROM_LIST', payload)
  },

  toggleSnackbar({ commit }, { display, text, color, timeout }) {
    display = display ?? true
    text = text ?? 'Operacion exitosa'
    color = color ?? 'success'
    timeout = timeout ?? 4000

    commit('SET_SNACKBAR', { display, text, color, timeout })
  },
}
