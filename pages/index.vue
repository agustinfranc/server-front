<template>
  <v-container>
    <div class="d-flex my-5">
      <div>
        <div class="display-1">Servidores - {{ count }}</div>
      </div>
      <v-spacer></v-spacer>
      <v-btn class="blue" @click.stop="openFormDialog()">
        Nuevo servidor
      </v-btn>
    </div>

    <v-simple-table>
      <template #default>
        <thead>
          <tr>
            <th class="text-left"></th>
            <th class="text-left">IP</th>
            <th class="text-left">Host</th>
            <th class="text-left">Descripcion</th>
            <th class="text-left">Acciones</th>
          </tr>
        </thead>
        <draggable v-model="list" tag="tbody" @change="moved">
          <tr v-for="item in list" :key="item.name">
            <td>
              <v-img
                lazy-src="https://picsum.photos/id/11/10/6"
                :src="item.avatar"
                class="rounded"
                max-height="35"
                max-width="35"
              ></v-img>
            </td>
            <td>{{ item.ip }}</td>
            <td>{{ item.host }}</td>
            <td>{{ item.description }}</td>
            <td>
              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <v-btn
                    icon
                    small
                    v-bind="attrs"
                    @click="sendRequest(item.id)"
                    v-on="on"
                    ><v-icon>mdi-book-clock</v-icon></v-btn
                  >
                </template>
                <span>Consultar por SNMP</span>
              </v-tooltip>

              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <v-btn
                    icon
                    small
                    v-bind="attrs"
                    @click="openChartsDialog(item.id)"
                    v-on="on"
                    ><v-icon>mdi-chart-line</v-icon></v-btn
                  >
                </template>
                <span>Ver gráficos</span>
              </v-tooltip>

              <v-btn icon small @click="openFormDialog(item)"
                ><v-icon>mdi-pencil</v-icon></v-btn
              >
              <v-btn icon small @click="deleteServer(item)"
                ><v-icon>mdi-delete</v-icon></v-btn
              >
            </td>
          </tr>
        </draggable>
      </template>
    </v-simple-table>

    <v-dialog v-model="dialogItem">
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
                  :src="item && item.avatar"
                  class="rounded"
                  :style="
                    !item.avatar && !parseSelectedFile ? 'display: none' : ''
                  "
                ></v-img>
                <v-img
                  v-else
                  lazy-src="https://picsum.photos/id/11/10/6"
                  :src="parseSelectedFile"
                  class="rounded"
                  :style="
                    !item.avatar && !parseSelectedFile ? 'display: none' : ''
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
                      v-model="item.ip"
                      :error-messages="errors.ip"
                      :counter="50"
                      label="IP"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="item.host"
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
                      v-model="item.description"
                      :error-messages="errors.description"
                      label="Descripcion"
                      rows="3"
                      :counter="200"
                    ></v-textarea>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>

            <v-btn
              :disabled="!valid"
              color="success"
              class="mr-4"
              @click="submit"
            >
              Guardar
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="headline"
          >Eliminar servidor {{ item.ip }}</v-card-title
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogDelete = false"
            >Cancelar</v-btn
          >
          <v-btn
            :disabled="!btnDelete"
            color="blue darken-1"
            @click="deleteServerConfirm"
            >Confirmar</v-btn
          >
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogCharts">
      <v-card>
        <v-card-title>
          Graficos

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                class="mx-2"
                x-small
                v-bind="attrs"
                v-on="on"
                ><v-icon>mdi-help-circle</v-icon></v-btn
              >
            </template>
            <span>Procesos y sesiones en funcion del tiempo. Intervalo de {{ intervalScale }} segundos. Se muestran los ultimos {{ intervalNumber }} intervalos</span>
          </v-tooltip>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <h3 class="my-1">Procesos</h3>

              <v-sheet color="rgba(0, 0, 0, .12)">
                <v-sparkline
                  :value="processes"
                  :labels="labels"
                  color="rgba(255, 255, 255, .7)"
                  line-width="1"
                  height="100"
                  padding="10"
                  stroke-linecap="round"
                  smooth
                >
                  <!-- <template v-slot:label="item"> ${{ item.value }} </template> -->
                </v-sparkline>
              </v-sheet>
            </v-col>
            <v-col cols="6">
              <h3 class="my-1">Sesiones</h3>

              <v-sheet color="rgba(0, 0, 0, .12)">
                <v-sparkline
                  :value="sessions"
                  :labels="labels"
                  color="rgba(255, 255, 255, .7)"
                  line-width="1"
                  height="100"
                  padding="10"
                  stroke-linecap="round"
                  smooth
                >
                  <!-- <template v-slot:label="item"> ${{ item.value }} </template> -->
                </v-sparkline>
              </v-sheet>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <Snackbar />
  </v-container>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  data() {
    return {
      dialogItem: false,
      dialogDelete: false,
      dialogCharts: false,
      btnDelete: true,
      valid: true,
      loading: true,
      item: {
        id: '',
        avatar: '',
        ip: '',
        host: '',
        description: '',
      },
      selectedFile: '',
      parseSelectedFile: '',
      errors: {},

      labels: [],
      sessions: [],
      processes: [],
      intervalScale: 1,
      intervalNumber: 1,
    }
  },

  async fetch() {
    this.loading = true

    const url = `servers`
    const res = await this.$nuxt.$axios.get(url)

    if (res.status !== 200) {
      this.toggleSnackbar({ text: 'Ocurrió un error', color: 'red accent-4' })
      return
    }

    this.list = res.data
    this.loading = false
  },

  computed: {
    list: {
      get() {
        return this.$store.state.list
      },
      set(value) {
        this.$store.dispatch('updateList', value)
      },
    },

    count() {
      return this.$store.state.list.length
    },
  },

  methods: {
    ...mapActions(['toggleSnackbar']),

    async moved(event) {
      try {
        await this.$axios.$put('sort', { servers: this.list })
      } catch (error) {
        console.log(error)

        this.toggleSnackbar({
          text: error.response?.data?.message ?? 'Ocurrió un error',
          color: 'red accent-4',
        })
      }
    },

    async submit() {
      if (!this.$refs.form.validate()) return

      this.valid = false

      try {
        const endpoint = 'servers'

        const res = this.item.id
          ? await this.$axios.$put(`${endpoint}/${this.item.id}`, this.item)
          : await this.$axios.$post(endpoint, this.item)

        this.item.id
          ? this.$store.dispatch('replaceInList', res)
          : this.$store.dispatch('addToList', res)

        await this.uploadImage(res, this)

        this.dialogItem = false

        this.$refs.form.reset()

        this.toggleSnackbar({ text: 'Nuevo servidor guardado' })
      } catch (error) {
        console.log(error)
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

    async uploadImage(item, _this) {
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

    async sendRequest(id) {
      try {
        await this.$axios.$post(`servers/${id}/request`, id)

        this.toggleSnackbar({ text: 'Consulta realizada correctamente' })
      } catch (error) {
        console.error(error)

        this.toggleSnackbar({
          text: error.response?.data?.message ?? 'Ocurrió un error',
          color: 'red accent-4',
        })
      }
    },

    openFormDialog(item) {
      this.dialogItem = true

      this.parseSelectedFile = ''

      this.item = { ...item } || {
        avatar: '',
        ip: '',
        host: '',
        description: '',
      }
    },

    async openChartsDialog(id) {
      this.dialogCharts = true

      try {
        const server = await this.$axios.$get(`servers/${id}`)

        this.processes = server.requests.map((e) => parseInt(e.process) ?? 0)
        this.sessions = server.requests.map((e) => parseInt(e.session) ?? 0)
        this.labels = server.requests.map((e) => {
          const unixTimestamp = parseInt(e.timestamp * 1000)
          const date = new Date(unixTimestamp)
          const hour = date.getHours()
          const minutes = date.getMinutes()
          return `${hour}:${minutes}`
        })

        this.intervalScale = server.intervalScale
        this.intervalNumber = server.intervalNumber
      } catch (error) {
        console.log(error)

        this.toggleSnackbar({
          text: error.message ?? 'Ocurrió un error',
          color: 'red accent-4',
        })
      }
    },

    deleteServer(item) {
      this.item = item
      this.dialogDelete = true
    },

    async deleteServerConfirm() {
      this.btnDelete = false

      try {
        await this.$axios.$delete(`servers/${this.item.id}`)

        this.dialogDelete = false

        this.toggleSnackbar({ text: 'Servidor eliminado correctamente' })

        this.$store.dispatch('removeFromList', this.item)
      } catch (error) {
        console.log(error)

        this.toggleSnackbar({
          text: error.message ?? 'Ocurrió un error',
          color: 'red accent-4',
        })
      } finally {
        this.btnDelete = true
      }
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
      this.parseSelectedFile = URL.createObjectURL(this.selectedFile)
    },
  },
}
</script>
