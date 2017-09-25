const PROFILE_URL = '/profile'
const TOKEN_URL = '/profile/token'
const RESET_URL = '/profile/password/reset'

export const state = () => ({
  user: null,
  token: null
})

export const actions = {

  async checkAuth ({ commit }) {
    try {
      const user = await this.$axios.$get(PROFILE_URL)
      commit('setUser', user)
    } catch (e) {
      commit('setUser', null)
    }

    try {
      const token = await this.$axios.$get(TOKEN_URL)
      commit('setToken', token)
    } catch (e) {
      commit('setToken', null)
    }
  },

  async resetPassword () {
    await this.$axios.$put(RESET_URL)
  }
}

export const mutations = {
  setUser (state, user) {
    state.user = user
  },
  setToken (state, token) {
    state.token = token
  }
}