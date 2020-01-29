import API from '@/views/Mes/Apis/'
import '@grapecity/wijmo.vue2.grid'
import dayjs from 'dayjs'
import * as wjcGridXlsx from '@grapecity/wijmo.grid.xlsx'
import * as wjcGrid from '@grapecity/wijmo.grid'
import { YYYYMMDD, YYYYMMDDHHMMSSMS } from '@/store/App.store'
import { mapGetters } from 'vuex'

export default {
  name: 'MesBatch',
  mounted () {
    // mes-cds-idpattern, mes-pos-batch, mes-pos-lot, mes-pos-idindex, mes-pos-lotbatchrel
    this.getTnCdsCodesCombo()
    this.getTnPosProdOrdersCombo()
    this.getTnPmsProcSgmtsCombo()
    this.getTnPosBatches()
  },
  computed: {
    ...mapGetters([
      'user',
      'theSite',
      'theApis'
    ])
  },
  props: {
    dayjsDF: {
      type: Object,
      default () {
        return this.$store.state.app.viewDateFormat.dayjs
      }
    },
    gridDF: {
      type: Object,
      default () {
        return this.$store.state.app.viewDateFormat.grid
      }
    }
  },
  methods: {
    // #region Initialized
    _getSelectionStats: function (grid) {
      var val = {}
      let sel = grid.selection
      for (let r = sel.topRow; r <= sel.bottomRow; r++) {
        for (let c = 0; c < grid.columns.length; c++) {
          val[grid.columns[c].binding] = grid.cells.getCellData(r, c, false)
        }
      }
      return val
    },
    posBatchFlexInitialized (grid, e) {
      this.posBatchListGrid = grid
      for (var k = 0; k < this.posBatchColumns.length; k++) {
        if (this.posBatchColumns[k].binding === 'useStatCd') {
          this.posBatchColumns[k].dataMap = this.cboUseStatCd
        }
      }
    },
    posLotBatchRelFlexInitialized (grid, e) {
      this.posLotBatchRelListGrid = grid
      for (var k = 0; k < this.posLotBatchRelColumns.length; k++) {
        if (this.posLotBatchRelColumns[k].binding === 'useStatCd') {
          this.posLotBatchRelColumns[k].dataMap = this.cboUseStatCd
        }
      }
    },
    // #endregion
    // #region Get Data
    async getTnCdsCodesCombo () {
      try {
        let payload = {
          siteId: this.theSite.siteId,
          cdClsId: 'IsUsable',
          useStatCd: 'Usable'
        }
        var useStatCdList = await API.mesCds.getTnCdsCodes(payload)
        for (var i = 0; i < useStatCdList.length; i++) {
          if (useStatCdList[i].cdId !== null) {
            this.cboUseStatCd.push(useStatCdList[i].cdId)
          }
        }
      } catch (error) {
      }
    },
    async getTnPosProdOrdersCombo () {
      let payload = {
        siteId: this.theSite.siteId,
        useStatCd: 'Usable',
        statCd: 'Active'
      }
      this.cboProdOrderId = await API.mesPos.getTnPosProdOrders(payload)
      this.cboProdOrderId.unshift({ prodOrdId: '' })
    },
    async getTnPosWorkOrdersCombo (prodOrdId) {
      let payload = {
        siteId: this.theSite.siteId,
        useStatCd: 'Usable',
        prodOrdId: prodOrdId
      }
      this.cboWorkOrderId = await API.mesPos.getTnPosWorkOrders(payload)
      this.cboWorkOrderId.unshift({ workOrdId: '' })
    },
    async getTnPmsProcSgmtsCombo () {
      let payload = {
        siteId: this.theSite.siteId,
        useStatCd: 'Usable'
      }
      this.cboProcSgmtId = await API.mesPms.getTnPmsProcSgmts(payload)
      this.cboProcSgmtId.unshift({ procSgmtId: '' })
    },
    // Batch, Lot Batch Rel Info
    async getPosBatchInfo (data) {
      var self = this
      let modifiedRow = this.$refs.batchGrid.getModifiedRows().length + this.$refs.lotBatchRelGrid.getModifiedRows().length
      if (modifiedRow > 0) {
        self.$dialog.confirm({
          message: (`${modifiedRow}${self.$t('mes.MESSAGE.W004')}`),
          cancelText: self.$t('mes.common.cancel'),
          confirmText: self.$t('mes.common.ok'),
          onConfirm: function () {
            self.getTnPosLotBatchRels(data)
            self.getTnPosBatches()
          },
          onCancel: function () {

          }
        })
      } else {
        self.getTnPosLotBatchRels(data)
      }
    },
    async getTnPosBatches () {
      try {
        this.posBatchList = []

        let payload = {
          siteId: this.theSite.siteId,
          useStatCd: 'Usable',
          sort: 'crtDt'
        }
        if (this.inputBtchId !== 'ALL') {
          payload.btchId = this.inputBtchId
        }
        this.posBatchList = await API.mesPos.getTnPosBatches(payload)
      } catch (error) {

      }
    },
    async getTnPosLotBatchRels (data) {
      try {
        let payload = {
          siteId: data.siteId,
          btchId: data.btchId,
          sort: 'fnlEvntDt'
        }
        this.posLotBatchRelList = await API.mesPos.getTnPosLotBatchRels(payload)
      } catch (error) {

      }
    },
    // 팝업창 Mapping 할 lot 조회
    async getCustomTnPosLots (btchId) {
      if (!this.inputProcSgmtId) {
        this.$dialog.alert(this.$t('mes.MESSAGE.W011'))
        return
      }
      try {
        this.posLotList = []
        let payload = [ {
          condition: 'Equal',
          key: 'siteId',
          values: this.theSite.siteId
        }, {
          condition: 'Equal',
          key: 'useStatCd',
          values: 'Usable'
        }, {
          condition: 'Equal',
          key: 'procStatCd',
          values: 'WaitForRule'
        }, {
          condition: 'Equal',
          key: 'statCd',
          values: 'Active'
        }, {
          condition: 'Equal',
          key: 'prodOrdId',
          values: this.inputProdOrdId
        }, {
          condition: 'Equal',
          key: 'workOrdId',
          values: this.inputWorkOrdId
        }, {
          condition: 'Equal',
          key: 'procSgmtId',
          values: this.inputProcSgmtId
        }, {
          condition: 'IsNull',
          key: 'srcBtchId',
          values: ' '
        }]
        this.posLotList = await API.mesPos.postCustomTnPosLots(payload)
      } catch (error) {

      }
    },
    // Lot Batch Relation grid에서 add했을 경우 0번째 row의 procSgmtId, workOrdId, prodOrdId가져오기 위해서
    async getTnPosLots (data) {
      try {
        this.posLotList = []

        let payload = {
          siteId: this.theSite.siteId,
          lotId: data.lotId
        }
        let result = await API.mesPos.getTnPosLots(payload)
        return result[0]
      } catch (error) {

      }
    },
    // Batch ID Pattern 조회
    async getGenerateIdByPattern (payload) {
      try {
        let data = await API.mesPos.postTnPosIdIndexesGenerateIdByPatternIVO(payload)
        return data
      } catch (error) {

      }
    },
    // #endregion
    // #region Set Data
    // Save batch, Lot Batch Rel
    savePosBatchs () {
      var checkBatchRowData = this.$refs.batchGrid.checkedRows
      var checkLotBatchRelRowData = this.$refs.lotBatchRelGrid.checkedRows
      var batchkeys = Object.keys(checkBatchRowData)
      var lotBatchRelKeys = Object.keys(checkLotBatchRelRowData)
      if (batchkeys.length === 0) {
        this.$dialog.alert(this.$t('mes.MESSAGE.W002'))
        return
      }
      var insertBatchDataList = []
      var updateBatchDataList = []
      var insertLotBatchRelDataList = []
      var updateLotBatchRelDataList = []
      var batchRow = null
      var batchLotRelRow = null

      for (var i = 0; i < batchkeys.length; i++) {
        // TODO KEY COLUMN
        batchRow = {}
        batchRow = this.createBatchData(checkBatchRowData[batchkeys[i]])
        if (batchRow === null) {
          return
        }
        if (checkBatchRowData[batchkeys[i]].isNew) {
          insertBatchDataList.push(batchRow)
        } else {
          updateBatchDataList.push(batchRow)
        }
      }
      if (lotBatchRelKeys.length > 0) {
        for (i = 0; i < lotBatchRelKeys.length; i++) {
        // TODO KEY COLUMN
          batchLotRelRow = {}
          batchLotRelRow = this.createLotBatchRelData(checkLotBatchRelRowData[lotBatchRelKeys[i]])
          if (batchLotRelRow === null) {
            return
          }
          if (checkLotBatchRelRowData[lotBatchRelKeys[i]].isNew) {
            insertLotBatchRelDataList.push(batchLotRelRow)
          } else {
            updateLotBatchRelDataList.push(batchLotRelRow)
          }
        }
      }
      var self = this
      this.$dialog.confirm({
        message: 'Batch: ' + (insertBatchDataList.length + updateBatchDataList.length) + '건 ' +
        'LotBatchRel: ' + (insertLotBatchRelDataList.length + updateLotBatchRelDataList.length) + self.$t('mes.MESSAGE.I002'),
        cancelText: self.$t('mes.common.cancel'),
        confirmText: self.$t('mes.common.ok'),
        onConfirm: function () {
          if (insertBatchDataList.length > 0 && updateBatchDataList.length === 0) {
            self.createPosBatchesInternal(insertBatchDataList).then(result => {
              if (result.result) {
                if (lotBatchRelKeys.length > 0) {
                  self.excuteLotBatchRelData(insertLotBatchRelDataList, updateLotBatchRelDataList)
                } else {
                  self.$dialog.alert(self.$t('mes.MESSAGE.I001'))
                }
                self.getTnPosBatches()
              } else {
                self.$dialog.alert(result.error)
              }
            })
          }
          if (updateBatchDataList.length > 0 && insertBatchDataList.length === 0) {
            self.updatePosBatches(updateBatchDataList).then(result => {
              if (result.result) {
                if (lotBatchRelKeys.length > 0) {
                  self.excuteLotBatchRelData(insertLotBatchRelDataList, updateLotBatchRelDataList)
                } else {
                  self.$dialog.alert(self.$t('mes.MESSAGE.I001'))
                }
                self.getTnPosBatches()
              } else {
                self.$dialog.alert(result.error)
              }
            })
          }
          if (updateBatchDataList.length > 0 && insertBatchDataList.length > 0) {
            self.createPosBatchesInternal(insertBatchDataList).then(result => {
              if (result.result) {
                self.updatePosBatches(updateBatchDataList).then(result => {
                  if (result.result) {
                    if (lotBatchRelKeys.length > 0) {
                      self.excuteLotBatchRelData(insertLotBatchRelDataList, updateLotBatchRelDataList)
                    } else {
                      self.$dialog.alert(self.$t('mes.MESSAGE.I001'))
                    }
                    self.getTnPosBatches()
                  } else {
                    self.$dialog.alert(result.error)
                  }
                })
              } else {
                self.$dialog.alert(result.error)
              }
            })
          }
        },
        onCancel: function () {
        }
      })
    },
    savePosLotBatchRels () {
      var self = this
      var checkBatchRowData = self.$refs.batchGrid.checkedRows
      var batchkeys = Object.keys(checkBatchRowData)
      if (batchkeys.length > 0) {
        self.savePosBatchs()
        return
      }
      var checkRowData = self.$refs.lotBatchRelGrid.checkedRows
      var keys = Object.keys(checkRowData)
      if (keys.length === 0) {
        self.$dialog.alert(self.$t('mes.MESSAGE.W002'))
        return
      }
      var insertDataList = []
      var updateDataList = []
      var row = null

      for (var i = 0; i < keys.length; i++) {
        // todo key
        row = {}
        row = self.createLotBatchRelData(checkRowData[keys[i]])
        if (row === null) {
          return
        }
        if (checkRowData[keys[i]].isNew) {
          insertDataList.push(row)
        } else {
          updateDataList.push(row)
        }
      }
      self.$dialog.confirm({
        message: (insertDataList.length + updateDataList.length) + self.$t('mes.MESSAGE.I002'),
        cancelText: self.$t('mes.common.cancel'),
        confirmText: self.$t('mes.common.ok'),
        onConfirm: function () {
          self.excuteLotBatchRelData(insertDataList, updateDataList)
        },
        onCancel: function () {
        }
      })
    },
    excuteLotBatchRelData (insertDataList, updateDataList) {
      if (insertDataList.length > 0 && updateDataList.length === 0) {
        this.createPosLotBatchRelsAndUpdatePosLots(insertDataList).then(result => {
          if (result.result) {
            this.$dialog.alert(this.$t('mes.MESSAGE.I001'))
            this.getTnPosLotBatchRels(this.selectTnPosBatch)
          } else {
            this.$dialog.alert(result.error)
          }
        })
      }
      if (updateDataList.length > 0 && insertDataList.length === 0) {
        this.updatePosLotBatchRels(updateDataList).then(result => {
          if (result.result) {
            this.$dialog.alert(this.$t('mes.MESSAGE.I001'))
            this.getTnPosLotBatchRels(this.selectTnPosBatch)
          } else {
            this.$dialog.alert(result.error)
          }
        })
      } //  this.updatePosLots()
      if (updateDataList.length > 0 && insertDataList.length > 0) {
        this.createPosLotBatchRelsAndUpdatePosLots(insertDataList).then(result => {
          if (result.result) {
            this.updatePosLotBatchRels(updateDataList).then(result => {
              if (result.result) {
                this.$dialog.alert(this.$t('mes.MESSAGE.I001'))
                this.getTnPosLotBatchRels(this.selectTnPosBatch)
              } else {
                this.$dialog.alert(result.error)
              }
            })
          } else {
            this.$dialog.alert(result.error)
          }
        })
      }
    },
    createBatchData (checkRowData) {
      var row = {}
      try {
        for (var i = 0; i < this.posBatchColumns.length; i++) {
          if (this.posBatchColumns[i].readOnly === false || this.posBatchColumns[i].modifiable === false) {
            row[this.posBatchColumns[i].binding] = checkRowData[this.posBatchColumns[i].binding]
          }
        }
        row['btchId'] = checkRowData['btchId']
        row['siteId'] = checkRowData['siteId']
        row['mdfyUserId'] = this.user.userId
      } catch (error) {
        this.$dialog.alert(this.$t('mes.MESSAGE.W005'))
        return row
      }
      return row
    },
    createLotBatchRelData (checkRowData) {
      var row = {}
      try {
        for (var i = 0; i < this.posLotBatchRelColumns.length; i++) {
          if (this.posLotBatchRelColumns[i].readOnly === false || this.posLotBatchRelColumns[i].modifiable === false) {
            row[this.posLotBatchRelColumns[i].binding] = checkRowData[this.posLotBatchRelColumns[i].binding]
          }
        }
        row['lotId'] = checkRowData['lotId']
        row['btchId'] = checkRowData['btchId']
        row['siteId'] = checkRowData['siteId']
        row['mdfyUserId'] = this.user.userId
      } catch (error) {
        this.$dialog.alert(this.$t('mes.MESSAGE.W005'))
        return row
      }
      return row
    },
    async createPosBatchesInternal (payload) {
      try {
        let data = await API.mesPos.postTnPosBatchesCreatePosBatchesInternal(payload, 'saveHist=true')
        return data
      } catch (error) {

      }
    },
    async updatePosBatches (payload) {
      try {
        let data = await API.mesPos.postTnPosBatchesUpdatePosBatches(payload, 'saveHist=true')
        return data
      } catch (error) {

      }
    },
    async createPosLotBatchRelsAndUpdatePosLots (payload) {
      try {
        let data = await API.mesPos.postTnPosLotBatchRelsCreatePosLotBatchRelsAndUpdatePosLots(payload, 'saveHist=true')
        return data
      } catch (error) {

      }
    },
    async updatePosLotBatchRels (payload) {
      try {
        let data = await API.mesPos.postTnPosLotBatchRelsUpdatePosLotBatchRels(payload, 'saveHist=true')
        return data
      } catch (error) {

      }
    },
    // Lot Batch Relation Real Delete 및 Batch 삭제(isDeleteBatch) 선택했을 경우 Batch Delete 작업
    async realDeletePosLotBatchRel () {
      var self = this
      var checkRowData = this.$refs.lotBatchRelGrid.checkedRows
      var keys = Object.keys(checkRowData)
      if (keys.length === 0) {
        this.$dialog.alert(this.$t('mes.MESSAGE.W002'))
        return
      }
      var payload = []
      var payloadObject = {}
      this.$dialog.confirm({
        message: self.$t('mes.MESSAGE.I016'),
        cancelText: self.$t('mes.common.cancel'),
        confirmText: self.$t('mes.common.ok'),
        onConfirm: async function () {
          for (var i = 0; i < keys.length; i++) {
            payloadObject = {}
            payloadObject = self.createLotBatchRelData(checkRowData[keys[i]])
            payload.push(payloadObject)
          }
          if (self.isDeleteBatch === true) {
            await API.mesPos.postTnPosLotBatchRelsRealDeletePosLotBatchRelsAndDeletePosBatches(payload).then(result => {
              if (result.result) {
                self.$dialog.alert(self.$t('mes.MESSAGE.I017'))
                self.getTnPosBatches()
                self.getTnPosLotBatchRels(payload[0])
              }
            })
          } else {
            await API.mesPos.postTnPosLotBatchRealDeletePosLotBatchRelsAndUpdatePosLots(payload).then(result => {
              if (result.result) {
                self.$dialog.alert(self.$t('mes.MESSAGE.I017'))
                self.getTnPosBatches()
                self.getTnPosLotBatchRels(payload[0])
              }
            })
          }
        },
        onCancel: function () {
        }
      })
    },
    // #endregion
    // #region Event
    // excel export
    exportBatchExcel () {
      wjcGridXlsx.FlexGridXlsxConverter.saveAsync(
        this.posBatchListGrid,
        {
          includeColumnHeaders: true,
          includeCellStyles: false,
          includeColumns: function (columns) {
            return columns.binding !== '_status.checked'
          },
          formatItem: function (args) {
            let p = args.panel
            let xlsxCell = args.xlsxCell

            if (p.cellType === wjcGrid.CellType.ColumnHeader) {
              xlsxCell.style.fill = {}
              xlsxCell.style.fill.color = '#EEEEEE'
            }
          }
        },
        'MesBatch-' + dayjs().format(this.dayjsDF[YYYYMMDDHHMMSSMS]) + '.xlsx'
      )
    },
    exportLotBatchRelExcel () {
      wjcGridXlsx.FlexGridXlsxConverter.saveAsync(
        this.posLotBatchRelListGrid,
        {
          includeColumnHeaders: true,
          includeCellStyles: false,
          includeColumns: function (columns) {
            return columns.binding !== '_status.checked'
          },
          formatItem: function (args) {
            let p = args.panel
            let xlsxCell = args.xlsxCell

            if (p.cellType === wjcGrid.CellType.ColumnHeader) {
              xlsxCell.style.fill = {}
              xlsxCell.style.fill.color = '#EEEEEE'
            }
          }
        },
        'MesLotBatchRelation-' + dayjs().format(this.dayjsDF[YYYYMMDDHHMMSSMS]) + '.xlsx'
      )
    },
    // Batch List에서 add했을 경우
    addBatchPopUpBtn () {
      this.isAddLotBatchRel = false
      this.modalActive = true
      var self = this
      self.lotGridColumns = [...self.lotGridColumns]
    },
    // Lot Batch Relation List에서 add했을 경우
    addLotBatchRelPopUpBtn () {
      // if (this.selectTnPosBatch === {}) {
      //   this.$dialog.alert(this.$t('mes.MESSAGE.W002'))
      //   return
      // }
      if (this.isSelectBatch === false) {
        this.$dialog.alert(this.$t('mes.MESSAGE.W002'))
        return
      }

      var self = this
      var checkBatchRowData = this.$refs.batchGrid.checkedRows
      var batchkeys = Object.keys(checkBatchRowData)
      if (batchkeys.length > 1) {
        this.$dialog.alert(this.$t('mes.MESSAGE.W022'))
        return
      }
      this.modalActive = true
      this.isAddLotBatchRel = true
      self.lotGridColumns = [...self.lotGridColumns]

      self.getTnPosLots(self.posLotBatchRelList[0]).then(result => {
        if (result) {
          this.inputProdOrdId = result['prodOrdId']
          this.getTnPosWorkOrdersCombo(this.inputProdOrdId)
          this.inputWorkOrdId = result['workOrdId']
          this.inputProcSgmtId = result['procSgmtId']
          this.getCustomTnPosLots()
        }
      })
    },
    // Popup Confirm Event
    clickPopUpConfirmBtn () {
      var self = this
      this.modalActive = false
      this.refreshPopupData()
      var checkedRowData = self.$refs.lotGrid.checkedRows
      var keys = Object.keys(checkedRowData)

      var userParamList = []
      if (self.isAddLotBatchRel !== true) {
        self.posLotBatchRelList = []
      }

      userParamList.push(checkedRowData[keys[0]]['procSgmtId'])
      var payload = {
        count: 1,
        siteId: self.theSite.siteId,
        idPatternId: 'BATCH_ID',
        commit: true,
        userParamList: userParamList
      }

      if (self.isAddLotBatchRel !== true) {
        self.getGenerateIdByPattern(payload).then(result => {
          var DataList = []
          for (var i = 0; i < keys.length; i++) {
            var row = {}
            row = this.createPosLotBatchRelData(checkedRowData[keys[i]])
            row['lotId'] = checkedRowData[keys[i]]['lotId']
            row['siteId'] = self.theSite.siteId
            row['btchId'] = result[0]
            row['isNew'] = true
            DataList.push(row)
          }

          self.$refs.lotBatchRelGrid.addRows(DataList, { checked: true })
          for (var k = 0; k < self.posLotBatchRelColumns.length; k++) {
            if (self.posLotBatchRelColumns[k].binding === 'useStatCd') {
              self.posLotBatchRelColumns[k].dataMap = self.cboUseStatCd
            }
          }
          // row = [{
          //   siteId: self.theSite.siteId,
          //   statCd: 'Created',
          //   btchId: result[0],
          //   btchNm: result[0],
          //   isNew: true
          // }]
          row = {}
          DataList = []
          row = this.createPosBatchData(checkedRowData[keys[i]])
          row['siteId'] = self.theSite.siteId
          row['statCd'] = 'Created'
          row['btchId'] = result[0]
          row['btchNm'] = result[0]
          // todo
          // row['useStatCd'] = result[0]
          //  row['mdfyUserId'] = result[0]
          row['isNew'] = true
          DataList.push(row)
          self.$refs.batchGrid.addRows(DataList, { checked: true })
        })
      } else {
        var DataList = []
        for (var i = 0; i < keys.length; i++) {
          var row = {}
          row = this.createPosLotBatchRelData(checkedRowData[keys[i]])
          row['lotId'] = checkedRowData[keys[i]]['lotId']
          row['siteId'] = self.theSite.siteId
          row['btchId'] = self.selectTnPosBatch['btchId']
          row['isNew'] = true
          // todo
          // row['useStatCd'] = result[0]
          //  row['mdfyUserId'] = result[0]
          DataList.push(row)
        }
        self.$refs.lotBatchRelGrid.addRows(DataList, { checked: true })
        for (var k = 0; k < this.posLotBatchRelColumns.length; k++) {
          if (this.posLotBatchRelColumns[k].binding === 'useStatCd') {
            this.posLotBatchRelColumns[k].dataMap = this.cboUseStatCd
          }
        }
      }
    },
    createPosLotBatchRelData (checkRowData) {
      var row = {}
      try {
        for (var i = 0; i < this.posLotBatchRelColumns.length; i++) {
          row[this.posLotBatchRelColumns[i].binding] = undefined
        }
        row['useStatCd'] = 'Usable'
      } catch (error) {
        this.$dialog.alert(this.$t('mes.MESSAGE.W005'))
        return row
      }
      return row
    },
    createPosBatchData (checkRowData) {
      var row = {}
      try {
        for (var i = 0; i < this.posBatchColumns.length; i++) {
          row[this.posBatchColumns[i].binding] = undefined
        }
      } catch (error) {
        this.$dialog.alert(this.$t('mes.MESSAGE.W005'))
        return row
      }
      return row
    },
    clickPopUpCloseBtn () {
      this.modalActive = false
      this.refreshPopupData()
    },
    refreshPopupData () {
      this.inputProdOrdId = undefined
      this.inputWorkOrdId = undefined
      this.inputProcSgmtId = undefined
      this.posLotList = []
    },
    disableANDableCheckLotBatchRel () {
      if (this.$refs.lotBatchRelGrid && this.$refs.lotBatchRelGrid.checkedRowCount === 0) {
        return true
      }
      return false
    },
    disableANDableCheckBatch () {
      if (this.$refs.batchGrid && this.$refs.batchGrid.checkedRowCount === 0) {
        return true
      }
      return false
    },
    disableANDableCheckDeleteBatch () {
      if (this.$refs.lotBatchRelGrid && this.$refs.lotBatchRelGrid.checkedRowCount === this.$refs.lotBatchRelGrid.itemsSource.length) {
        var checkRowData = this.$refs.lotBatchRelGrid.checkedRows
        var keys = Object.keys(checkRowData)
        for (var i = 0; i < keys.length; i++) {
          if (checkRowData[keys[i]].isNew) {
            return true
          }
        }
        return false
      }

      this.isDeleteBatch = false
      return true
    },
    batchGridSectionChanged: function (grid, event) {
      if (grid.rows.length > 0) {
        this.changeSelectedPanel('batch-table')

        this.selectTnPosBatch = this._getSelectionStats(grid)
        let select = grid.selection
        if (this.$refs.batchGrid.rows[select.row].dataItem.isNew) {
          return
        }
        this.isSelectBatch = true
        this.getPosBatchInfo(this.selectTnPosBatch)
      }
    },
    lotBatchRelGridSectionChanged: function (grid, event) {
      if (grid.rows.length > 0) {
        this.changeSelectedPanel('lotBatchRel-table')
      }
    },
    changeSelectedPanel (panel) {
      this.selectedPanel = panel
    }
    // #endregion
  },
  data () {
    return {
      selectedPanel: undefined,
      modalActive: false,
      isDeleteBatch: false, // Batch Delete Check Box - Relation이 모두 삭제 될 때 Batch 삭제 여부
      isAddLotBatchRel: false, // Lot Batch Relation Add Button 클릭 유무
      isSelectBatch: false, // Batch grid 클릭 유무
      // Grid Data
      posBatchList: [],
      posLotBatchRelList: [],
      // Grid Select Data
      selectTnPosBatch: {},
      // Combo
      cboUseStatCd: [],
      // Input Variable
      inputBtchId: undefined,
      // ------------Modal------------
      // Grid Data
      posLotList: [],
      // Combo
      cboProdOrderId: [],
      cboWorkOrderId: [],
      cboProcSgmtId: [],
      // Input Variable
      inputProdOrdId: undefined,
      inputWorkOrdId: undefined,
      inputProcSgmtId: undefined,
      // Batch Grid Column
      posBatchColumns: [
        { label: this.$t('mes.DEFAULT_COLUMNS.OBJID'), binding: 'objId', readOnly: false, visible: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.BTCHID'), binding: 'btchId', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.SITEID'), binding: 'siteId', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.BTCHNM'), binding: 'btchNm', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.BTCHTYP'), binding: 'btchTyp', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.STATCD'), binding: 'statCd', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.EVNTNM'), binding: 'evntNm', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.PREVEVNTNM'), binding: 'prevEvntNm', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.CSTMEVNTNM'), binding: 'cstmEvntNm', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.PREVCSTMEVNTNM'), binding: 'prevCstmEvntNm', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.USESTATCD'), binding: 'useStatCd', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.TRNSDESC'), binding: 'trnsDesc', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.RSNCD'), binding: 'rsnCd', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.TRNSCM'), binding: 'trnsCm', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.CRTUSERID'), binding: 'crtUserId', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.CRTDT'), binding: 'crtDt', readOnly: true, dataType: 'Date', format: this.gridDF[YYYYMMDD] },
        { label: this.$t('mes.DEFAULT_COLUMNS.MDFYUSERID'), binding: 'mdfyUserId', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.MDFYDT'), binding: 'mdfyDt', readOnly: true, dataType: 'Date', format: this.gridDF[YYYYMMDDHHMMSSMS] },
        { label: this.$t('mes.DEFAULT_COLUMNS.FNLEVNTDT'), binding: 'fnlEvntDt', readOnly: true, dataType: 'Date', format: this.gridDF[YYYYMMDDHHMMSSMS] }
      ],
      // Lot Batch Relation Grid Column
      posLotBatchRelColumns: [
        { label: this.$t('mes.DEFAULT_COLUMNS.OBJID'), binding: 'objId', readOnly: false, visible: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.LOTID'), binding: 'lotId', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.BTCHID'), binding: 'btchId', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.SITEID'), binding: 'siteId', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.EVNTNM'), binding: 'evntNm', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.PREVEVNTNM'), binding: 'prevEvntNm', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.CSTMEVNTNM'), binding: 'cstmEvntNm', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.PREVCSTMEVNTNM'), binding: 'prevCstmEvntNm', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.USESTATCD'), binding: 'useStatCd', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.TRNSDESC'), binding: 'trnsDesc', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.RSNCD'), binding: 'rsnCd', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.TRNSCM'), binding: 'trnsCm', readOnly: false },
        { label: this.$t('mes.DEFAULT_COLUMNS.CRTUSERID'), binding: 'crtUserId', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.CRTDT'), binding: 'crtDt', readOnly: true, dataType: 'Date', format: this.gridDF[YYYYMMDD] },
        { label: this.$t('mes.DEFAULT_COLUMNS.MDFYUSERID'), binding: 'mdfyUserId', readOnly: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.MDFYDT'), binding: 'mdfyDt', readOnly: true, dataType: 'Date', format: this.gridDF[YYYYMMDDHHMMSSMS] },
        { label: this.$t('mes.DEFAULT_COLUMNS.FNLEVNTDT'), binding: 'fnlEvntDt', readOnly: true, dataType: 'Date', format: this.gridDF[YYYYMMDDHHMMSSMS] }
      ],
      // Lot Grid Column
      lotGridColumns: [
        { label: this.$t('mes.DEFAULT_COLUMNS.LOTID'), binding: 'lotId', readOnly: true, visible: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.SITEID'), binding: 'siteId', readOnly: true, visible: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.EQPID'), binding: 'eqpId', readOnly: true, visible: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.PRODDEFID'), binding: 'prodDefId', readOnly: true, visible: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.PROCDEFID'), binding: 'procDefId', readOnly: true, visible: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.PROCSGMTID'), binding: 'procSgmtId', readOnly: true, visible: true },
        { label: this.$t('mes.DEFAULT_COLUMNS.WORKORDID'), binding: 'workOrdId', readOnly: true, visible: true }
      ]
    }
  },
  beforeRouteLeave (to, from, next) {
    let modifiedRow = this.$refs.batchGrid.getModifiedRows().length + this.$refs.lotBatchRelGrid.getModifiedRows().length
    if (modifiedRow > 0) {
      let result = confirm(`${modifiedRow}${this.$t('mes.MESSAGE.W004')}`)
      if (!result) {
        next(false)
        return
      }
    }
    next()
  }
}