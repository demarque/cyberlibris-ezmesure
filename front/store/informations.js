/* eslint-disable import/no-extraneous-dependencies */
import Vue from 'vue';

export default {
  state: () => ({
    establishments: [],
    establishment: null,
  }),

  actions: {
    async getEstablishment({ commit }) {
      return this.$axios.$get('/correspondents/myestablishment')
        .then(establishment => commit('setEstablishment', establishment))
        .catch(() => {});
    },
    setEstablishment({ commit }, establishment) {
      commit('setEstablishment', establishment);
    },
    getEstablishments({ commit }) {
      return this.$axios.$get('/correspondents/list')
        .then(establishments => commit('setEstablishments', establishments))
        .catch(() => commit('setEstablishments', []));
    },
    // eslint-disable-next-line no-unused-vars
    deleteEstablishments({ commit }, ids) {
      return this.$axios.$post('/correspondents/delete', ids);
    },
    // eslint-disable-next-line no-unused-vars
    storeOrUpdateEstablishment({ commit }, establishment) {
      return this.$axios.$post('/correspondents/', establishment, {
        headers: {
          // eslint-disable-next-line no-underscore-dangle
          'Content-Type': `multipart/form-data; boundary=${establishment._boundary}`,
        },
      });
    },
    setEstablishments({ commit }, value) {
      commit('setEstablishments', value);
    },
  },

  mutations: {
    setEstablishments(state, establishments) {
      Vue.set(state, 'establishments', establishments);
    },
    setEstablishment(state, establishment) {
      Vue.set(state, 'establishment', establishment);
    },
  },
};