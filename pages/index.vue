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
      <Form @close="closeFormDialog" />
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
              <v-btn icon class="mx-2" x-small v-bind="attrs" v-on="on"
                ><v-icon>mdi-help-circle</v-icon></v-btn
              >
            </template>
            <span
              >Procesos y sesiones en funcion del tiempo. Intervalo de
              {{ intervalScale }} segundos. Se muestran los ultimos
              {{ intervalNumber }} intervalos</span
            >
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
                  :gradient="gradient"
                  gradient-direction="top"
                >
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
                  :gradient="gradient"
                  gradient-direction="top"
                >
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
import Form from '~/components/Form.vue'

export default {
  components: {
    Form,
  },

  data() {
    return {
      dialogDelete: false,
      dialogCharts: false,
      dialogItem: false,
      btnDelete: true,
      loading: true,

      item: {
        id: '',
        avatar: '',
        ip: '',
        host: '',
        description: '',
      },

      labels: [],
      sessions: [],
      processes: [],
      intervalScale: 1,
      intervalNumber: 1,
      gradient: ['#f72047', '#ffd200', '#1feaea'],
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
    ...mapActions(['toggleSnackbar', 'setItem']),

    openFormDialog(item) {
      this.dialogItem = true

      this.setItem(item)
    },

    closeFormDialog() {
      this.dialogItem = false
    },

    async moved(event) {
      try {
        await this.$axios.$put('sort', { servers: this.list })
      } catch (error) {
        this.toggleSnackbar({
          text: error.response?.data?.message ?? 'Ocurrió un error',
          color: 'red accent-4',
        })
      }
    },

    async sendRequest(id) {
      try {
        await this.$axios.$post(`servers/${id}/request`, id)

        this.toggleSnackbar({ text: 'Consulta realizada correctamente' })
      } catch (error) {
        this.toggleSnackbar({
          text: error.response?.data?.message ?? 'Ocurrió un error',
          color: 'red accent-4',
        })
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
        this.toggleSnackbar({
          text: error.message ?? 'Ocurrió un error',
          color: 'red accent-4',
        })
      } finally {
        this.btnDelete = true
      }
    },
  },
}
</script>
