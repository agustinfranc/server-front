<template>
  <v-card>
    <v-card-title>Servidor</v-card-title>

    <v-card-text>
      <v-form
        ref="form"
        v-model="valid"
        lazy-validation
        @submit.prevent="submit"
      >
        <v-row>
          <v-col cols="12" sm="4" md="3" class="align-self-start">
            <v-img
              v-if="!parseSelectedFile"
              lazy-src="https://picsum.photos/id/11/10/6"
              :src="itemForm && itemForm.avatar"
              class="rounded"
              :style="
                !itemForm.avatar && !parseSelectedFile ? 'display: none' : ''
              "
            ></v-img>
            <v-img
              v-else
              lazy-src="https://picsum.photos/id/11/10/6"
              :src="parseSelectedFile"
              class="rounded"
              :style="
                !itemForm.avatar && !parseSelectedFile ? 'display: none' : ''
              "
            ></v-img>
            <input
              ref="fileInput"
              class="mt-3 v-btn v-btn--block v-btn--contained theme--dark v-size--small accent"
              type="file"
              style="display: none"
              @input="changeAvatar"
            />
            <v-btn
              small
              block
              color="accent"
              class="mt-3"
              @click="$refs.fileInput.click()"
              >Subir Avatar</v-btn
            >
          </v-col>

          <v-col cols="12" sm="8" md="9">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="itemForm.ip"
                  :error-messages="errors.ip"
                  :counter="50"
                  label="IP"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="itemForm.host"
                  :error-messages="errors.host"
                  :counter="50"
                  label="Host"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6" align-self="start">
                <v-textarea
                  v-model="itemForm.description"
                  :error-messages="errors.description"
                  label="Descripcion"
                  rows="3"
                  :counter="200"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <v-btn :disabled="!valid" color="success" class="mr-4" @click="submit">
          Guardar
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      loading: true,
      valid: true,
      item: {
        id: '',
        avatar: '',
        ip: '',
        host: '',
        description: '',
      },
      selectedFile: '',
      errors: {},
    }
  },

  computed: {
    ...mapState(['parseSelectedFile']),

    itemForm() {
      return { ...this.$store.state.item }
    },
  },

  methods: {
    ...mapActions(['toggleSnackbar']),

    async submit() {
      if (!this.$refs.form.validate()) return

      this.valid = false

      try {
        const endpoint = 'servers'

        const res = this.itemForm.id
          ? await this.$axios.$put(
              `${endpoint}/${this.itemForm.id}`,
              this.itemForm
            )
          : await this.$axios.$post(endpoint, this.itemForm)

        this.itemForm.id
          ? this.$store.dispatch('replaceInList', res)
          : this.$store.dispatch('addToList', res)

        await this.uploadImage(res)

        this.$emit('close', false)

        this.$refs.form.reset()

        this.toggleSnackbar({ text: 'Nuevo servidor guardado' })
      } catch (error) {
        this.errors = error.response?.data?.errors ?? {}

        this.toggleSnackbar({
          text: error.response?.data?.message ?? 'Ocurrió un error',
          color: 'red accent-4',
        })

        setTimeout(() => this.$refs.form.resetValidation(), 3000)
      } finally {
        this.valid = true
      }
    },

    async uploadImage(item) {
      if (!this.selectedFile) {
        return
      }

      const fd = new FormData()
      fd.append('image', this.selectedFile, this.selectedFile.name)

      const serverId = item.id

      const res = await this.$axios.$post(`servers/${serverId}/upload`, fd, {
        onUploadProgress: (uploadEvent) => {
          console.log(
            'Upload Progress',
            Math.round((uploadEvent.loaded / uploadEvent.total) * 100) + '%'
          )
        },
      })

      this.item.avatar = this.selectedFile.name

      this.$store.dispatch('replaceInList', res)

      this.toggleSnackbar({ text: 'Imagen subida correctamente' })
    },

    changeAvatar(event) {
      if (
        !event.target.files[0] ||
        event.target.files[0].size >= 1048576 ||
        (event.target.files[0].type !== 'image/jpeg' &&
          event.target.files[0].type !== 'image/png' &&
          event.target.files[0].type !== 'image/gif')
      ) {
        this.toggleSnackbar({
          text: 'La imagen excede el tamaño máximo o no es un formato válido',
          color: 'red accent-4',
        })

        return
      }

      this.selectedFile = event.target.files[0]

      this.$store.dispatch(
        'setParseSelectedFile',
        URL.createObjectURL(this.selectedFile)
      )
    },
  },
}
</script>
