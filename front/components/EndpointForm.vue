<template>
  <v-dialog v-model="show" width="700">
    <v-card>
      <v-card-title v-if="endpointForm.id" class="headline" v-text="formTitle" />
      <v-card-title v-else class="headline" v-text="$t('endpoints.addEndpoint')" />

      <v-card-text>
        <v-form id="endpointForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-text-field
            v-model="endpointForm.vendor"
            :label="`${$t('endpoints.vendor')} *`"
            :rules="[v => !!v || $t('fieldIsRequired')]"
            outlined
            required
          />

          <v-text-field
            v-model="endpointForm.sushiUrl"
            :label="`${$t('endpoints.url')} *`"
            :rules="[v => !!v || $t('fieldIsRequired')]"
            outlined
            required
            @change="onSushiUrlChange"
          />

          <v-alert
            :value="looksLikeSoapUrl"
            dense
            outlined
            type="warning"
            icon="mdi-alert-outline"
            transition="scale-transition"
          >
            {{ $t('endpoints.soapWarning') }}
          </v-alert>

          <v-combobox
            v-model="endpointForm.tags"
            :items="availableTags"
            :label="$t('endpoints.tags')"
            item-text="name"
            hide-selected
            return-object
            hide-no-data
            multiple
            small-chips
            outlined
          />

          <v-text-field
            v-model="endpointForm.technicalProvider"
            :label="$t('endpoints.technicalProvider')"
            outlined
            required
          />

          <v-text-field
            v-model="endpointForm.counterVersion"
            :label="$t('endpoints.counterVersion')"
            :rules="counterVersionRules"
            outlined
            required
          />

          <v-textarea
            v-model="endpointForm.description"
            :label="$t('endpoints.description')"
            outlined
          />

          <v-checkbox
            v-model="endpointForm.requireCustomerId"
            :label="$t('endpoints.requireCustomerId')"
            hide-details
          />
          <v-checkbox
            v-model="endpointForm.requireRequestorId"
            :label="$t('endpoints.requireRequestorId')"
            hide-details
          />
          <v-checkbox
            v-model="endpointForm.requireApiKey"
            :label="$t('endpoints.requireApiKey')"
            hide-details
          />
          <v-checkbox
            v-model="endpointForm.isSushiCompliant"
            :label="$t('endpoints.isSushiCompliant')"
            hide-details
          />
          <v-checkbox
            v-model="endpointForm.ignoreReportValidation"
            :label="$t('endpoints.ignoreReportValidation')"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-title>
        {{ $t('endpoints.queryParameters') }}
      </v-card-title>

      <v-card-text>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="text-justify" v-html="$t('endpoints.paramSeparatorDesc')" />
        <v-text-field
          v-model="endpointForm.paramSeparator"
          :label="$t('endpoints.paramSeparator')"
          dense
          outlined
          required
        />

        <p v-text="$t('endpoints.pleaseEnterParams')" />

        <v-btn
          type="submit"
          color="primary"
          small
          outlined
          @click="addParam"
        >
          <v-icon left>
            mdi-plus
          </v-icon>
          {{ $t('add') }}
        </v-btn>

        <SushiParam
          v-for="(param, index) in endpointForm.params"
          :key="index"
          v-model="endpointForm.params[index]"
          class="my-2"
          @remove="removeParam(index)"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('close') }}
        </v-btn>

        <v-btn
          type="submit"
          form="endpointForm"
          color="primary"
          text
          :disabled="!valid"
          :loading="saving"
          v-text="editMode ? $t('update') : $t('add')"
        />
      </v-card-actions>

      <ConfirmDialog ref="confirm" />
    </v-card>
  </v-dialog>
</template>

<script>
import ConfirmDialog from '~/components/ConfirmDialog';
import SushiParam from '~/components/SushiParam';

export default {
  components: {
    ConfirmDialog,
    SushiParam,
  },
  props: {
    availableTags: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      show: false,
      saving: false,
      valid: false,
      formTitle: '',

      endpointForm: {
        id: null,
        params: [],
        tags: [],
        vendor: '',
        sushiUrl: '',
        description: '',
        technicalProvider: '',
        counterVersion: '',
        paramSeparator: '',
        validated: false,
        requireCustomerId: false,
        requireRequestorId: false,
        requireApiKey: false,
        isSushiCompliant: false,
        ignoreReportValidation: false,
      },

      counterVersionRules: [
        (value) => {
          const pattern = /^[0-9]+(\.[0-9]+(\.[0-9]+)?)?$/;

          if (value === '' || pattern.test(value)) {
            return true;
          }
          return this.$t('fieldMustMatch', { pattern: pattern.toString() });
        },
      ],
    };
  },
  computed: {
    editMode() { return !!this.endpointForm.id; },
    looksLikeSoapUrl() {
      if (typeof this.endpointForm?.sushiUrl !== 'string') { return false; }
      return this.endpointForm?.sushiUrl.toLowerCase().includes('soap');
    },
  },
  methods: {
    editEndpoint(data = {}) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.endpointForm.id = data.id;
      this.endpointForm.params = Array.isArray(data.params) ? data.params : [];
      this.endpointForm.tags = Array.isArray(data.tags) ? data.tags : [];

      this.endpointForm.vendor = data.vendor || '';
      this.endpointForm.sushiUrl = data.sushiUrl || '';
      this.endpointForm.description = data.description || '';
      this.endpointForm.technicalProvider = data.technicalProvider || '';
      this.endpointForm.counterVersion = data.counterVersion || '';
      this.endpointForm.paramSeparator = data.paramSeparator || '';

      this.endpointForm.validated = !!data.validated;
      this.endpointForm.requireCustomerId = !!data.requireCustomerId;
      this.endpointForm.requireRequestorId = !!data.requireRequestorId;
      this.endpointForm.requireApiKey = !!data.requireApiKey;
      this.endpointForm.isSushiCompliant = !!data.isSushiCompliant;
      this.endpointForm.ignoreReportValidation = !!data.ignoreReportValidation;

      this.formTitle = this.endpointForm.vendor;
      this.show = true;
    },

    createEndpoint() {
      this.editEndpoint();
    },

    async onSushiUrlChange() {
      const sushiUrl = this.endpointForm?.sushiUrl;
      const checkReg = /\/(status|members|reports).*/i;

      if (checkReg.test(sushiUrl)) {
        const fixUrl = await this.$refs.confirm.open({
          title: this.$t('areYouSure'),
          message: this.$t('endpoints.sushiNotRootDetected'),
          agreeText: this.$t('fixIt'),
          disagreeText: this.$t('leaveIt'),
        });

        if (fixUrl) {
          this.endpointForm.sushiUrl = sushiUrl.replace(checkReg, '');
        }
      }
    },

    addParam() {
      this.endpointForm.params.unshift({ name: '', value: '', scope: 'all' });
    },

    removeParam(index) {
      this.$delete(this.endpointForm.params, index);
    },

    async save() {
      this.saving = true;

      this.endpointForm.params = this.endpointForm.params.filter(param => param.name);

      try {
        if (this.endpointForm.id) {
          await this.$axios.$patch(`/sushi-endpoints/${this.endpointForm.id}`, {
            ...this.endpointForm,
            endpointId: this.endpoint?.id,
          });
        } else {
          await this.$axios.$post('/sushi-endpoints', { ...this.endpointForm });
          this.show = false;
        }
        this.$emit('update');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('formSendingFailed'));
        this.saving = false;
        return;
      }

      this.$store.dispatch('snacks/success', this.$t('informationSubmitted'));
      this.saving = false;
      this.show = false;
    },
  },
};
</script>
