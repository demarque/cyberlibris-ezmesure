<template>
  <v-menu>
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        icon
        :disabled="isContact && !isAdmin"
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>
          mdi-cog
        </v-icon>
      </v-btn>
    </template>

    <v-list min-width="200">
      <v-list-item
        v-for="action in actions"
        :key="action.icon"
        @click="action.callback()"
      >
        <v-list-item-icon>
          <v-icon>{{ action.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title v-text="action.label" />
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  props: {
    member: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {};
  },
  computed: {
    isAdmin() {
      return this.$auth.hasScope('superuser') || this.$auth.hasScope('admin');
    },
    isContact() {
      const isTech = this.member?.techContact;
      const isDoc = this.member?.docContact;
      return (isTech || isDoc);
    },
    actions() {
      return [
        {
          icon: 'mdi-shield',
          label: this.$t('institutions.members.changePermissions'),
          callback: () => { this.$emit('permissions'); },
        },
        {
          icon: 'mdi-account-off',
          label: this.$t('revoke'),
          callback: () => { this.$emit('delete'); },
        },
      ];
    },
  },
};
</script>
